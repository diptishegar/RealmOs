package auth

import "github.com/google/uuid"

// RegisterRequest — POST /auth/register
// Username/password signup. Email is not required.
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Name     string `json:"name"     binding:"required,min=2,max=50"`
	Password string `json:"password" binding:"required,min=8,max=64"`
}

// LoginRequest — POST /auth/login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// ForgotPasswordRequest — POST /auth/forgot-password
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest — POST /auth/reset-password
type ResetPasswordRequest struct {
	Token    string `json:"token"    binding:"required"`
	Password string `json:"password" binding:"required,min=8,max=64"`
}

// AuthResponse is returned by register and login.
type AuthResponse struct {
	Token       string   `json:"token"`
	TokenExpiry int64    `json:"token_expiry"` // unix timestamp (seconds)
	User        UserInfo `json:"user"`
}

// UserInfo is the minimal profile embedded in auth responses.
type UserInfo struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Username  string    `json:"username"`
	Onboarded bool      `json:"onboarded"`
}

// ForgotPasswordResponse — message + optional reset token (dev mode only).
type ForgotPasswordResponse struct {
	Message    string `json:"message"`
	ResetToken string `json:"reset_token,omitempty"`
}
