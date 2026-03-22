package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidResetToken  = errors.New("invalid or expired reset token")
)

// Repository handles auth-related database operations.
type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Register creates a new user account with a bcrypt-hashed password.
func (r *Repository) Register(ctx context.Context, req RegisterRequest) (*UserInfo, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	username := strings.ToLower(strings.TrimSpace(req.Username))

	u := &UserInfo{}
	err = r.db.QueryRow(ctx, `
		INSERT INTO users (name, username, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, name, username, onboarded
	`, req.Name, username, string(hash)).Scan(
		&u.ID, &u.Name, &u.Username, &u.Onboarded,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "users_username_key" {
				return nil, ErrUsernameTaken
			}
			return nil, ErrEmailTaken
		}
		return nil, fmt.Errorf("register user: %w", err)
	}
	return u, nil
}

// Login validates username + password and returns user info.
func (r *Repository) Login(ctx context.Context, username, password string) (*UserInfo, error) {
	u := &UserInfo{}
	var passwordHash string

	err := r.db.QueryRow(ctx, `
		SELECT id, name, username, onboarded, COALESCE(password_hash, '')
		FROM users WHERE username = $1
	`, strings.ToLower(strings.TrimSpace(username))).Scan(
		&u.ID, &u.Name, &u.Username, &u.Onboarded, &passwordHash,
	)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	if passwordHash == "" {
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return u, nil
}

// CreateResetToken generates a secure reset token, stores its SHA-256 hash,
// and returns the plain token. Silently succeeds if the email is not found.
func (r *Repository) CreateResetToken(ctx context.Context, email string) (string, error) {
	var userID uuid.UUID
	err := r.db.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`,
		strings.ToLower(strings.TrimSpace(email))).Scan(&userID)
	if err != nil {
		return "", nil // Don't reveal whether the email exists
	}

	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	token := hex.EncodeToString(b)

	h := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(h[:])

	expiry := time.Now().Add(1 * time.Hour)
	_, err = r.db.Exec(ctx, `
		UPDATE users
		SET reset_token_hash = $1, reset_token_expires_at = $2
		WHERE id = $3
	`, tokenHash, expiry, userID)
	if err != nil {
		return "", fmt.Errorf("store reset token: %w", err)
	}
	return token, nil
}

// ResetPassword validates the reset token and updates the user's password.
func (r *Repository) ResetPassword(ctx context.Context, token, newPassword string) error {
	h := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(h[:])

	var userID uuid.UUID
	err := r.db.QueryRow(ctx, `
		SELECT id FROM users
		WHERE reset_token_hash = $1 AND reset_token_expires_at > NOW()
	`, tokenHash).Scan(&userID)
	if err != nil {
		return ErrInvalidResetToken
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	_, err = r.db.Exec(ctx, `
		UPDATE users
		SET password_hash = $1, reset_token_hash = NULL, reset_token_expires_at = NULL
		WHERE id = $2
	`, string(passwordHash), userID)
	return err
}
