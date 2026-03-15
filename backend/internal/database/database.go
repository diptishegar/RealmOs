package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/realmos/backend/internal/config"
)

// DB is the connection pool shared across the app.
// pgxpool is safe for concurrent use — one pool for the whole server.
type DB struct {
	Pool *pgxpool.Pool
}

// Connect creates and validates the PostgreSQL connection pool.
func Connect(cfg *config.DatabaseConfig) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	connStr := fmt.Sprintf(
		"postgresql://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Name, cfg.SSLMode,
	)

	poolConfig, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse db config: %w", err)
	}

	// Pool settings for t2.micro (2 vCPU, 1GB RAM) — keep it lean
	poolConfig.MaxConns = 10
	poolConfig.MinConns = 2
	poolConfig.MaxConnLifetime = 1 * time.Hour
	poolConfig.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify the connection works
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("✓ Connected to PostgreSQL")
	return &DB{Pool: pool}, nil
}

// Close shuts down the pool gracefully.
func (db *DB) Close() {
	db.Pool.Close()
	log.Println("Database connection closed")
}
