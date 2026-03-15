package response

import "github.com/gin-gonic/gin"

// Standard API response envelope.
// Every endpoint returns this shape — makes frontend parsing predictable.
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// OK sends a 200 with data.
func OK(c *gin.Context, data interface{}) {
	c.JSON(200, Response{Success: true, Data: data})
}

// Created sends a 201 with data.
func Created(c *gin.Context, data interface{}) {
	c.JSON(201, Response{Success: true, Data: data})
}

// BadRequest sends a 400 with an error message.
func BadRequest(c *gin.Context, msg string) {
	c.JSON(400, Response{Success: false, Error: msg})
}

// NotFound sends a 404.
func NotFound(c *gin.Context, msg string) {
	c.JSON(404, Response{Success: false, Error: msg})
}

// InternalError sends a 500.
func InternalError(c *gin.Context, msg string) {
	c.JSON(500, Response{Success: false, Error: msg})
}

// Conflict sends a 409 (duplicate resource).
func Conflict(c *gin.Context, msg string) {
	c.JSON(409, Response{Success: false, Error: msg})
}
