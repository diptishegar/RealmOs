// Package jwtutil handles JWT generation and validation for RealmOs.
// We use HS256 (shared secret) since this is a single-user personal app.
package jwtutil

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// TokenTTL is how long a JWT stays valid — 90 days for a personal app.
const TokenTTL = 90 * 24 * time.Hour

// Claims is the payload stored inside each JWT.
type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Name   string    `json:"name"`
	jwt.RegisteredClaims
}

// Generate creates a signed JWT for the given user.
// Returns (tokenString, expiryTime, error).
func Generate(userID uuid.UUID, name, secret string) (string, time.Time, error) {
	expiry := time.Now().Add(TokenTTL)
	claims := Claims{
		UserID: userID,
		Name:   name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(expiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	return signed, expiry, err
}

// Validate parses and validates a JWT string, returning its claims.
func Validate(tokenStr, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
