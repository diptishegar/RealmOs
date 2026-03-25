package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all environment configuration for the server.
type Config struct {
	Port      string
	Env       string
	JWTSecret string
	Database  DatabaseConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

// DSN returns the PostgreSQL connection string.
func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode,
	)
}

// Load reads the .env file and returns a Config.
// In production we rely on environment variables already being set.
func Load() (*Config, error) {
	// Ignore error — .env may not exist in production (env vars set externally)
	_ = godotenv.Load()

	cfg := &Config{
		Port:      getEnv("PORT", "8080"),
		Env:       getEnv("ENV", "development"),
		JWTSecret: getEnv("JWT_SECRET", "realmos-dev-secret-change-in-prod"),
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "realmos_user"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "realmos"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
	}

	if cfg.Database.Password == "" {
		return nil, fmt.Errorf("DB_PASSWORD is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
