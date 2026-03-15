package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger logs each request: method, path, status, latency.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)
		log.Printf("[%d] %s %s — %v",
			c.Writer.Status(), c.Request.Method, c.Request.URL.Path, latency)
	}
}

// CORS allows the mobile app to talk to the API.
// In production you'd restrict the origin, but for personal use this is fine.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, X-User-ID, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// Recovery catches panics and returns a 500 instead of crashing.
func Recovery() gin.HandlerFunc {
	return gin.Recovery()
}

// UserID extracts the X-User-ID header and stores it in context.
// Phase 1: no JWT, just trust the header. Phase 2: replace with JWT middleware.
func UserID() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID != "" {
			c.Set("user_id", userID)
		}
		c.Next()
	}
}

// RequireUserID rejects requests that don't have X-User-ID.
func RequireUserID() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists || userID == "" {
			c.JSON(401, gin.H{"success": false, "error": "X-User-ID header required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
