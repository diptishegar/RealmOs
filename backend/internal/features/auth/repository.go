package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// ─── Sentinel errors ──────────────────────────────────────────────────────────

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidPIN         = errors.New("pin must be 4–6 digits")
	ErrTooManyAttempts    = errors.New("too many failed login attempts")
	ErrInvalidOTP         = errors.New("invalid or expired OTP")
	ErrOTPMaxAttempts     = errors.New("too many OTP verification attempts")
)

// ─── Rate limiter (in-memory) ─────────────────────────────────────────────────
//
// WHY: Prevent brute-force PIN guessing.
// HOW: Track failed attempts per username. After 5 failures, lock for 15 min.
//      Uses sync.Map for concurrent-safe access across goroutines.

const (
	maxLoginAttempts = 5
	lockoutDuration  = 15 * time.Minute
)

type loginAttempt struct {
	mu       sync.Mutex
	count    int
	lockedAt time.Time
}

var loginAttempts sync.Map // key: username → *loginAttempt

func getLoginAttempt(username string) *loginAttempt {
	v, _ := loginAttempts.LoadOrStore(username, &loginAttempt{})
	return v.(*loginAttempt)
}

func (a *loginAttempt) isLocked() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.count >= maxLoginAttempts {
		if time.Since(a.lockedAt) < lockoutDuration {
			return true
		}
		a.count = 0 // lockout expired — auto-reset
	}
	return false
}

func (a *loginAttempt) record(failed bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if failed {
		a.count++
		if a.count >= maxLoginAttempts {
			a.lockedAt = time.Now()
		}
	} else {
		a.count = 0 // successful login resets counter
	}
}

// ─── OTP cache (in-memory) ────────────────────────────────────────────────────
//
// WHY: OTPs are short-lived (10 min), no need for DB persistence.
//      In-memory is fast and avoids extra table / migration.
// HOW: SHA-256 hash the OTP before storing — never store plaintext.
//      Limit to 3 verification attempts to prevent enumeration.

const (
	otpExpiry      = 10 * time.Minute
	otpMaxAttempts = 3
)

type otpEntry struct {
	mu        sync.Mutex
	hashedOTP string
	expiresAt time.Time
	attempts  int
	used      bool
}

var otpCache sync.Map // key: username (lowercase) → *otpEntry

func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func hashOTP(otp string) string {
	h := sha256.Sum256([]byte(otp))
	return hex.EncodeToString(h[:])
}

// checkOTP verifies username + OTP against the cache (does not consume it).
func checkOTP(username, otp string) error {
	key := strings.ToLower(username)
	v, ok := otpCache.Load(key)
	if !ok {
		return ErrInvalidOTP
	}
	entry := v.(*otpEntry)
	entry.mu.Lock()
	defer entry.mu.Unlock()

	if entry.used || time.Now().After(entry.expiresAt) {
		otpCache.Delete(key)
		return ErrInvalidOTP
	}
	if entry.attempts >= otpMaxAttempts {
		return ErrOTPMaxAttempts
	}
	if entry.hashedOTP != hashOTP(otp) {
		entry.attempts++
		return ErrInvalidOTP
	}
	return nil
}

// ─── Repository ───────────────────────────────────────────────────────────────

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Register creates a new account with a bcrypt-hashed PIN.
// Email is optional (used for future OTP delivery via email).
// Goals are stored in user_goals.priority_areas if provided.
func (r *Repository) Register(ctx context.Context, req RegisterRequest) (*UserInfo, error) {
	if !pinRegex.MatchString(req.Pin) {
		return nil, ErrInvalidPIN
	}

	pinHash, err := bcrypt.GenerateFromPassword([]byte(req.Pin), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash pin: %w", err)
	}

	username := strings.ToLower(strings.TrimSpace(req.Username))

	// email is optional — pass nil so DB stores NULL (allows unique index on non-null values)
	var emailArg interface{}
	if email := strings.ToLower(strings.TrimSpace(req.Email)); email != "" {
		emailArg = email
	}

	u := &UserInfo{}
	err = r.db.QueryRow(ctx, `
		INSERT INTO users (name, username, email, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, username, onboarded
	`, req.Name, username, emailArg, string(pinHash)).Scan(
		&u.ID, &u.Name, &u.Username, &u.Onboarded,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if strings.Contains(pgErr.ConstraintName, "username") {
				return nil, ErrUsernameTaken
			}
			return nil, ErrEmailTaken
		}
		return nil, fmt.Errorf("register user: %w", err)
	}

	// Store signup goals in user_goals.priority_areas (non-fatal)
	if len(req.Goals) > 0 {
		if _, err := r.db.Exec(ctx, `
			INSERT INTO user_goals (user_id, priority_areas)
			VALUES ($1, $2)
			ON CONFLICT (user_id) DO UPDATE SET priority_areas = EXCLUDED.priority_areas
		`, u.ID, req.Goals); err != nil {
			fmt.Printf("warn: could not save signup goals for %s: %v\n", u.Username, err)
		}
	}

	return u, nil
}

// Login validates username + PIN and returns the user.
// Rate-limited: 5 wrong PINs → 15-min lockout.
func (r *Repository) Login(ctx context.Context, username, pin string) (*UserInfo, error) {
	att := getLoginAttempt(username)
	if att.isLocked() {
		return nil, ErrTooManyAttempts
	}

	u := &UserInfo{}
	var pinHash string
	err := r.db.QueryRow(ctx, `
		SELECT id, name, username, onboarded, COALESCE(password_hash, '')
		FROM users WHERE username = $1
	`, strings.ToLower(strings.TrimSpace(username))).Scan(
		&u.ID, &u.Name, &u.Username, &u.Onboarded, &pinHash,
	)
	if err != nil || pinHash == "" {
		att.record(true)
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(pinHash), []byte(pin)); err != nil {
		att.record(true)
		return nil, ErrInvalidCredentials
	}

	att.record(false)
	return u, nil
}

// RequestOTP generates a 6-digit OTP for PIN reset.
// Returns the plain OTP so dev mode can expose it.
// Silently succeeds if the username is not found (don't reveal user existence).
func (r *Repository) RequestOTP(ctx context.Context, username string) (string, error) {
	var userID uuid.UUID
	err := r.db.QueryRow(ctx,
		`SELECT id FROM users WHERE username = $1`,
		strings.ToLower(strings.TrimSpace(username)),
	).Scan(&userID)
	if err != nil {
		return "", nil // user not found — silent
	}

	otp, err := generateOTP()
	if err != nil {
		return "", fmt.Errorf("generate otp: %w", err)
	}

	otpCache.Store(strings.ToLower(username), &otpEntry{
		hashedOTP: hashOTP(otp),
		expiresAt: time.Now().Add(otpExpiry),
	})

	// TODO (prod): send OTP via email/SMS here using userID's email
	_ = userID

	return otp, nil
}

// VerifyOTP checks that the OTP is valid without consuming it.
// Used by the optional verify-otp endpoint before submitting reset-pin.
func (r *Repository) VerifyOTP(username, otp string) error {
	return checkOTP(username, otp)
}

// ResetPIN verifies the OTP and atomically sets a new bcrypt-hashed PIN.
// Deletes the OTP from cache after success to prevent reuse.
func (r *Repository) ResetPIN(ctx context.Context, username, otp, newPIN string) error {
	if !pinRegex.MatchString(newPIN) {
		return ErrInvalidPIN
	}
	if err := checkOTP(username, otp); err != nil {
		return err
	}

	pinHash, err := bcrypt.GenerateFromPassword([]byte(newPIN), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash pin: %w", err)
	}

	_, err = r.db.Exec(ctx,
		`UPDATE users SET password_hash = $1 WHERE username = $2`,
		string(pinHash), strings.ToLower(username),
	)
	if err != nil {
		return fmt.Errorf("update pin: %w", err)
	}

	otpCache.Delete(strings.ToLower(username)) // consume OTP
	return nil
}
