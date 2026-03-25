package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/realmos/backend/internal/config"
	"github.com/realmos/backend/internal/database"
	"github.com/realmos/backend/internal/features/auth"
	"github.com/realmos/backend/internal/features/period"
	"github.com/realmos/backend/internal/features/quotes"
	"github.com/realmos/backend/internal/features/user"
	"github.com/realmos/backend/internal/middleware"
)

func main() {
	// 1. Load config from .env
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Config error: %v", err)
	}

	// 2. Connect to PostgreSQL
	db, err := database.Connect(&cfg.Database)
	if err != nil {
		log.Fatalf("Database error: %v", err)
	}
	defer db.Close()

	// 3. Set Gin mode
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 4. Create router
	r := gin.New()
	r.Use(middleware.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())
	r.Use(middleware.UserID(cfg.JWTSecret))

	// 5. Health check (no auth needed)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "RealmOs API",
			"version": "0.1.0",
		})
	})

	// 6. API v1 routes
	v1 := r.Group("/api/v1")

	isDev := cfg.Env != "production"

	// Auth — public routes (register, login, forgot-pin, verify-otp, reset-pin)
	authRepo := auth.NewRepository(db.Pool)
	auth.NewHandler(authRepo, cfg.JWTSecret, isDev).RegisterPublicRoutes(v1)

	// User
	userRepo := user.NewRepository(db.Pool)
	user.NewHandler(userRepo).RegisterRoutes(v1)

	// Quotes
	quotesRepo := quotes.NewRepository(db.Pool)
	quotes.NewHandler(quotesRepo).RegisterRoutes(v1)

	// Period
	periodRepo := period.NewRepository(db.Pool)
	period.NewHandler(periodRepo).RegisterRoutes(v1)

	// 7. Start server with graceful shutdown
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("✓ RealmOs API running on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Forced shutdown: %v", err)
	}
	log.Println("Server stopped cleanly")
}
