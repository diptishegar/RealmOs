package period

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/realmos/backend/pkg/response"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	period := rg.Group("/period")
	period.POST("/profile", h.UpsertProfile)
	period.GET("/profile", h.GetProfile)
	period.POST("/log", h.LogDay)
	period.DELETE("/log/:date", h.DeleteDay)
	period.GET("/logs", h.GetLogs)
}

// getUserID extracts and parses the X-User-ID from context.
func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}
	id, err := uuid.Parse(val.(string))
	if err != nil {
		return uuid.Nil, false
	}
	return id, true
}

func (h *Handler) UpsertProfile(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		response.BadRequest(c, "valid X-User-ID required")
		return
	}

	var req UpsertProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	profile, err := h.repo.UpsertProfile(c.Request.Context(), userID, req)
	if err != nil {
		response.InternalError(c, "failed to save period profile")
		return
	}

	response.OK(c, profile)
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		response.BadRequest(c, "valid X-User-ID required")
		return
	}

	profile, err := h.repo.GetProfile(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "period profile not found")
		return
	}

	response.OK(c, profile)
}

func (h *Handler) LogDay(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		response.BadRequest(c, "valid X-User-ID required")
		return
	}

	var req LogPeriodDayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	day, err := h.repo.LogDay(c.Request.Context(), userID, req)
	if err != nil {
		response.InternalError(c, "failed to log period day")
		return
	}

	response.Created(c, day)
}

func (h *Handler) DeleteDay(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		response.BadRequest(c, "valid X-User-ID required")
		return
	}

	date := c.Param("date")
	if date == "" {
		response.BadRequest(c, "date parameter required")
		return
	}

	if err := h.repo.DeleteDay(c.Request.Context(), userID, date); err != nil {
		response.NotFound(c, "period day not found")
		return
	}

	response.OK(c, gin.H{"message": "period day removed"})
}

func (h *Handler) GetLogs(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		response.BadRequest(c, "valid X-User-ID required")
		return
	}

	var q GetLogsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if q.From == "" || q.To == "" {
		response.BadRequest(c, "from and to query params are required (YYYY-MM-DD)")
		return
	}

	days, err := h.repo.GetLogs(c.Request.Context(), userID, q.From, q.To)
	if err != nil {
		response.InternalError(c, "failed to fetch period logs")
		return
	}

	if days == nil {
		days = []PeriodDay{}
	}

	response.OK(c, days)
}
