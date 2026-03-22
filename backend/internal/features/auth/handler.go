package auth

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/realmos/backend/pkg/jwtutil"
	"github.com/realmos/backend/pkg/response"
)

// Handler wires auth HTTP routes.
type Handler struct {
	repo      *Repository
	jwtSecret string
	isDev     bool // in dev mode, reset token is returned in the response
}

func NewHandler(repo *Repository, jwtSecret string, isDev bool) *Handler {
	return &Handler{repo: repo, jwtSecret: jwtSecret, isDev: isDev}
}

// RegisterPublicRoutes mounts auth routes — NOT behind JWT middleware.
func (h *Handler) RegisterPublicRoutes(rg *gin.RouterGroup) {
	auth := rg.Group("/auth")
	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)
	auth.POST("/forgot-password", h.ForgotPassword)
	auth.POST("/reset-password", h.ResetPassword)
}

// Register creates a new account and returns a JWT.
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
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

// Login validates credentials and returns a JWT.
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.repo.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "incorrect email or password",
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

// ForgotPassword generates a password reset token.
// In production this would send the token via email.
// In development the token is returned in the response body.
func (h *Handler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	token, err := h.repo.CreateResetToken(c.Request.Context(), req.Email)
	if err != nil {
		response.InternalError(c, "failed to process request")
		return
	}

	resp := ForgotPasswordResponse{
		Message: "If that email is registered, a reset link has been sent.",
	}
	if h.isDev && token != "" {
		resp.ResetToken = token
	}

	response.OK(c, resp)
}

// ResetPassword validates the reset token and sets a new password.
func (h *Handler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.repo.ResetPassword(c.Request.Context(), req.Token, req.Password); err != nil {
		if errors.Is(err, ErrInvalidResetToken) {
			response.BadRequest(c, "reset link is invalid or has expired")
			return
		}
		response.InternalError(c, "failed to reset password")
		return
	}

	response.OK(c, gin.H{"message": "Password updated successfully. Please log in."})
}
