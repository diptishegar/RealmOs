package user

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/realmos/backend/pkg/response"
)

// Handler wires HTTP routes to the repository.
// Service layer is kept minimal here since user ops are simple CRUD.
type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// RegisterRoutes mounts all user routes onto the router group.
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/users", h.CreateUser)
	rg.GET("/users/:id", h.GetUser)
	rg.PUT("/users/:id", h.UpdateUser)
	rg.PUT("/users/:id/goals", h.UpdateGoals)
	rg.GET("/users/:id/goals", h.GetGoals)
}

func (h *Handler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.repo.Create(c.Request.Context(), req)
	if err != nil {
		response.InternalError(c, "failed to create user")
		return
	}

	response.Created(c, user)
}

func (h *Handler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	user, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}

	response.OK(c, user)
}

func (h *Handler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.repo.Update(c.Request.Context(), id, req)
	if err != nil {
		response.InternalError(c, "failed to update user")
		return
	}

	response.OK(c, user)
}

func (h *Handler) UpdateGoals(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	var req UpdateGoalsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	goals, err := h.repo.UpsertGoals(c.Request.Context(), id, req)
	if err != nil {
		response.InternalError(c, "failed to update goals")
		return
	}

	response.OK(c, goals)
}

func (h *Handler) GetGoals(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	goals, err := h.repo.GetGoals(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "goals not found")
		return
	}

	response.OK(c, goals)
}
