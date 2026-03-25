package auth

import (
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"
)

// pinRegex validates that a PIN is exactly 4–6 digits.
var pinRegex = regexp.MustCompile(`^\d{4,6}$`)

var allowedGoals = map[string]struct{}{
	"health":   {},
	"fitness":  {},
	"hormones": {},
	"periods":  {},
	"skin":     {},
	"hair":     {},
}

func validateGoals(goals []string) error {
	if len(goals) == 0 {
		return errors.New("goals are required")
	}
	seen := make(map[string]struct{}, len(goals))
	for _, goal := range goals {
		normalized := strings.ToLower(strings.TrimSpace(goal))
		if normalized == "" {
			return errors.New("goals cannot be empty")
		}
		if _, ok := allowedGoals[normalized]; !ok {
			return errors.New("invalid goal: " + normalized)
		}
		if _, ok := seen[normalized]; ok {
			return errors.New("duplicate goal: " + normalized)
		}
		seen[normalized] = struct{}{}
	}
	return nil
}

func normalizeGoals(goals []string) []string {
	normalized := make([]string, 0, len(goals))
	for _, goal := range goals {
		normalized = append(normalized, strings.ToLower(strings.TrimSpace(goal)))
	}
	return normalized
}

// ─── Request models ───────────────────────────────────────────────────────────

// RegisterRequest — POST /auth/register
// PIN must be 4–6 digits. Email and Goals are required.
// Goals are stored in user_goals.priority_areas on signup.
type RegisterRequest struct {
	Username   string   `json:"username"    binding:"required,min=3,max=30"`
	Name       string   `json:"name"        binding:"required,min=2,max=50"`
	Pin        string   `json:"pin"         binding:"required"`
	ConfirmPin string   `json:"confirm_pin" binding:"required"`
	Email      string   `json:"email"       binding:"omitempty,email"`
	Goals      []string `json:"goals"       binding:"required"`
}

// LoginRequest — POST /auth/login
type LoginRequest struct {
	Username   string `json:"username"    binding:"required"`
	Pin        string `json:"pin"         binding:"required"`
	RememberMe bool   `json:"remember_me"`
}

// ForgotPINRequest — POST /auth/forgot-pin
// Triggers OTP generation + mock email delivery.
type ForgotPINRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
}

// VerifyOTPRequest — POST /auth/verify-otp
// Optional pre-check: client can verify OTP is valid before submitting new PIN.
type VerifyOTPRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	OTP      string `json:"otp" binding:"required"`
}

// ResetPINRequest — POST /auth/reset-pin
// Verifies OTP + sets new PIN in one step.
type ResetPINRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	OTP      string `json:"otp"     binding:"required"`
	NewPIN   string `json:"new_pin" binding:"required"`
}

// ─── Response models ──────────────────────────────────────────────────────────

// AuthResponse is returned by register and login.
type AuthResponse struct {
	Token              string   `json:"token"`
	TokenExpiry        int64    `json:"token_expiry"` // unix timestamp (seconds)
	RefreshToken       string   `json:"refresh_token,omitempty"`
	RefreshTokenExpiry int64    `json:"refresh_token_expiry,omitempty"`
	User               UserInfo `json:"user"`
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

// RefreshTokenRequest — POST /auth/refresh
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// RefreshTokenResponse — new access token
type RefreshTokenResponse struct {
	Token       string `json:"token"`
	TokenExpiry int64  `json:"token_expiry"`
}
