package auth

import (
	"regexp"

	"github.com/google/uuid"
)

// pinRegex validates that a PIN is exactly 4–6 digits.
var pinRegex = regexp.MustCompile(`^\d{4,6}$`)

// ─── Request models ───────────────────────────────────────────────────────────

// RegisterRequest — POST /auth/register
// PIN must be 4–6 digits. Email is optional but needed for forgot-PIN flow.
// Goals are stored in user_goals.priority_areas on signup.
type RegisterRequest struct {
	Username string   `json:"username" binding:"required,min=3,max=30"`
	Name     string   `json:"name"     binding:"required,min=2,max=50"`
	Pin      string   `json:"pin"      binding:"required"`
	Email    string   `json:"email"    binding:"omitempty,email"`
	Goals    []string `json:"goals"`
}

// LoginRequest — POST /auth/login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Pin      string `json:"pin"      binding:"required"`
}

// ForgotPINRequest — POST /auth/forgot-pin
// Triggers OTP generation + mock email delivery.
type ForgotPINRequest struct {
	Username string `json:"username" binding:"required"`
}

// VerifyOTPRequest — POST /auth/verify-otp
// Optional pre-check: client can verify OTP is valid before submitting new PIN.
type VerifyOTPRequest struct {
	Username string `json:"username" binding:"required"`
	OTP      string `json:"otp"      binding:"required"`
}

// ResetPINRequest — POST /auth/reset-pin
// Verifies OTP + sets new PIN in one step.
type ResetPINRequest struct {
	Username string `json:"username" binding:"required"`
	OTP      string `json:"otp"      binding:"required"`
	NewPIN   string `json:"new_pin"  binding:"required"`
}

// ─── Response models ──────────────────────────────────────────────────────────

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

// ForgotPINResponse — message + optional OTP (dev mode only).
type ForgotPINResponse struct {
	Message string `json:"message"`
	OTP     string `json:"otp,omitempty"` // only returned when isDev=true
}

// VerifyOTPResponse
type VerifyOTPResponse struct {
	Verified bool   `json:"verified"`
	Message  string `json:"message"`
}
