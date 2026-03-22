package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env from backend root (one level up from cmd/migrate)
	_ = godotenv.Load(filepath.Join("..", "..", ".env"))
	_ = godotenv.Load(".env") // also try cwd

	host := getEnv("DB_HOST", "13.127.71.96")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "realmos_user")
	password := getEnv("DB_PASSWORD", "")
	dbname := getEnv("DB_NAME", "realmos")
	sslmode := getEnv("DB_SSLMODE", "disable")

	// Use key=value DSN instead of URL — avoids special character issues in passwords
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode,
	)

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	log.Printf("Connected to PostgreSQL at %s:%s/%s", host, port, dbname)

	// Find migration files relative to this binary's working directory
	// Try a few locations depending on where the command is run from
	migrationsDir := "../database/migrations" // from backend/cmd/migrate

	if migrationsDir == "" {
		log.Fatal("Could not find database/migrations directory. Run from backend/ folder.")
	}

	// Collect and sort .sql files
	entries, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil || len(entries) == 0 {
		log.Fatalf("No .sql files found in %s", migrationsDir)
	}
	sort.Strings(entries)

	// Execute each migration file
	for _, file := range entries {
		content, err := os.ReadFile(file)
		if err != nil {
			log.Fatalf("Could not read %s: %v", file, err)
		}

		log.Printf("--> Running: %s", filepath.Base(file))
		_, err = conn.Exec(ctx, string(content))
		if err != nil {
			log.Fatalf("Migration failed (%s): %v", filepath.Base(file), err)
		}
		log.Printf("    ✓ Done")
	}

	log.Println("All migrations applied successfully ✓")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
