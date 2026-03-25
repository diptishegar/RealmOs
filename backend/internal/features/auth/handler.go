package auth

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/realmos/backend/pkg/jwtutil"
	"github.com/realmos/backend/pkg/response"
)

// Handler wires auth HTTP routes.
type Handler struct {
	repo      *Repository
	jwtSecret string
	isDev     bool // in dev mode, OTPs are returned in the response body
}

func NewHandler(repo *Repository, jwtSecret string, isDev bool) *Handler {
	return &Handler{repo: repo, jwtSecret: jwtSecret, isDev: isDev}
}

// RegisterPublicRoutes mounts all auth routes (no JWT middleware needed).
func (h *Handler) RegisterPublicRoutes(rg *gin.RouterGroup) {
	auth := rg.Group("/auth")
	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)
	auth.POST("/forgot-pin", h.ForgotPIN)
	auth.POST("/verify-otp", h.VerifyOTP)
	auth.POST("/reset-pin", h.ResetPIN)
	auth.POST("/refresh", h.RefreshToken)
}

// Register — POST /auth/register
// Creates a new account. PIN must be 4–6 digits. Email and Goals are required.
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if !pinRegex.MatchString(req.Pin) {
		response.BadRequest(c, "PIN must be 4–6 digits")
		return
	}
	if req.Pin != req.ConfirmPin {
		response.BadRequest(c, "PIN and confirm PIN must match")
		return
	}
	if err := validateGoals(req.Goals); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	req.Goals = normalizeGoals(req.Goals)

	user, err := h.repo.Register(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrUsernameTaken) {
			response.Conflict(c, "that username is already taken")
			return
		}
		if errors.Is(err, ErrEmailTaken) {
			response.Conflict(c, "an account with this email already exists")
			return
		}
		response.InternalError(c, "failed to create account")
		return
	}

	token, expiry, err := jwtutil.Generate(user.ID, user.Name, h.jwtSecret)
	if err != nil {
		response.InternalError(c, "failed to generate token")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": AuthResponse{
			Token:       token,
			TokenExpiry: expiry.Unix(),
			User:        *user,
		},
	})
}

// Login — POST /auth/login
// Validates username + PIN. Rate-limited to 5 attempts per 15 minutes.
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.repo.Login(c.Request.Context(), req.Username, req.Pin)
	if err != nil {
		if errors.Is(err, ErrTooManyAttempts) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "too many failed attempts, please wait 15 minutes",
			})
			return
		}
		if errors.Is(err, ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "incorrect username or PIN",
			})
			return
		}
		response.InternalError(c, "login failed")
		return
	}

	token, expiry, err := jwtutil.Generate(user.ID, user.Name, h.jwtSecret)
	if err != nil {
		response.InternalError(c, "failed to generate token")
		return
	}

	resp := AuthResponse{
		Token:       token,
		TokenExpiry: expiry.Unix(),
		User:        *user,
	}
	if req.RememberMe {
		refreshToken, refreshExpiry, err := h.repo.IssueRefreshToken(user.ID, user.Name)
		if err != nil {
			response.InternalError(c, "failed to create refresh token")
			return
		}
		resp.RefreshToken = refreshToken
		resp.RefreshTokenExpiry = refreshExpiry.Unix()
	}

	response.OK(c, resp)
}

// ForgotPIN — POST /auth/forgot-pin
// Generates a 6-digit OTP and (in production) would send it via email/SMS.
// In dev mode, OTP is returned in the response body for testing.
func (h *Handler) ForgotPIN(c *gin.Context) {
	var req ForgotPINRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	identifier, ok := selectIdentifier(req.Username, req.Email)
	if !ok {
		response.BadRequest(c, "username or email is required")
		return
	}

	otp, err := h.repo.RequestOTP(c.Request.Context(), identifier)
	if err != nil {
		response.InternalError(c, "failed to process request")
		return
	}

	if h.isDev && otp != "" {
		log.Printf("[DEV] OTP for %s: %s", identifier, otp)
	}

	resp := ForgotPINResponse{
		Message: "If that account is registered, an OTP has been sent.",
	}
	if h.isDev && otp != "" {
		resp.OTP = otp
	}

	response.OK(c, resp)
}

// VerifyOTP — POST /auth/verify-otp
// Optional pre-check: lets the client confirm the OTP is valid before submitting a new PIN.
func (h *Handler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	identifier, ok := selectIdentifier(req.Username, req.Email)
	if !ok {
		response.BadRequest(c, "username or email is required")
		return
	}

	if err := h.repo.VerifyOTP(c.Request.Context(), identifier, req.OTP); err != nil {
		if errors.Is(err, ErrOTPMaxAttempts) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "too many OTP attempts, please request a new one",
			})
			return
		}
		response.BadRequest(c, "invalid or expired OTP")
		return
	}

	response.OK(c, VerifyOTPResponse{Verified: true, Message: "OTP verified"})
}

// ResetPIN — POST /auth/reset-pin
// Verifies OTP + sets a new bcrypt-hashed PIN in one step.
func (h *Handler) ResetPIN(c *gin.Context) {
	var req ResetPINRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if !pinRegex.MatchString(req.NewPIN) {
		response.BadRequest(c, "new PIN must be 4–6 digits")
		return
	}

	identifier, ok := selectIdentifier(req.Username, req.Email)
	if !ok {
		response.BadRequest(c, "username or email is required")
		return
	}

	if err := h.repo.ResetPIN(c.Request.Context(), identifier, req.OTP, req.NewPIN); err != nil {
		if errors.Is(err, ErrOTPMaxAttempts) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "too many OTP attempts, please request a new one",
			})
			return
		}
		if errors.Is(err, ErrInvalidOTP) {
			response.BadRequest(c, "invalid or expired OTP")
			return
		}
		if errors.Is(err, ErrInvalidPIN) {
			response.BadRequest(c, "new PIN must be 4–6 digits")
			return
		}
		response.InternalError(c, "failed to reset PIN")
		return
	}

	response.OK(c, gin.H{"message": "PIN reset successfully. Please log in."})
}

// RefreshToken — POST /auth/refresh
// Exchanges a refresh token for a new access token.
func (h *Handler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	userID, name, err := h.repo.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		response.BadRequest(c, "invalid or expired refresh token")
		return
	}

	token, expiry, err := jwtutil.Generate(userID, name, h.jwtSecret)
	if err != nil {
		response.InternalError(c, "failed to generate token")
		return
	}

	response.OK(c, RefreshTokenResponse{
		Token:       token,
		TokenExpiry: expiry.Unix(),
	})
}

func selectIdentifier(username, email string) (string, bool) {
	if value := strings.TrimSpace(username); value != "" {
		return value, true
	}
	if value := strings.TrimSpace(email); value != "" {
		return value, true
	}
	return "", false
}
