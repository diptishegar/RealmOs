package middleware

import (
	"log"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/realmos/backend/pkg/jwtutil"
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

// UserID extracts the user ID from Authorization (JWT) or X-User-ID header.
// If Authorization is present but invalid, it will not fall back to X-User-ID.
func UserID(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			if token != "" {
				if claims, err := jwtutil.Validate(token, jwtSecret); err == nil {
					c.Set("user_id", claims.UserID.String())
					c.Next()
					return
				}
			}
		} else {
			userID := c.GetHeader("X-User-ID")
			if userID != "" {
				c.Set("user_id", userID)
			}
		}
		c.Next()
	}
}

// RequireUserID rejects requests that don't have X-User-ID.
func RequireUserID() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists || userID == "" {
			c.JSON(401, gin.H{"success": false, "error": "Authorization or X-User-ID required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
