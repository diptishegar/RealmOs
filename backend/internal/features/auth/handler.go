package auth

import (
	"errors"
	"log"
	"net/http"

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
}

// Register — POST /auth/register
// Creates a new account. PIN must be 4–6 digits. Email and Goals are optional.
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

	response.OK(c, AuthResponse{
		Token:       token,
		TokenExpiry: expiry.Unix(),
		User:        *user,
	})
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

	otp, err := h.repo.RequestOTP(c.Request.Context(), req.Username)
	if err != nil {
		response.InternalError(c, "failed to process request")
		return
	}

	if h.isDev && otp != "" {
		log.Printf("[DEV] OTP for %s: %s", req.Username, otp)
	}

	resp := ForgotPINResponse{
		Message: "If that username is registered, an OTP has been sent.",
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

	if err := h.repo.VerifyOTP(req.Username, req.OTP); err != nil {
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

	if err := h.repo.ResetPIN(c.Request.Context(), req.Username, req.OTP, req.NewPIN); err != nil {
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
