package quotes

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/realmos/backend/pkg/response"
)

type Quote struct {
	ID       uuid.UUID `json:"id"`
	Text     string    `json:"text"`
	Author   *string   `json:"author"`
	Category string    `json:"category"`
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetRandom(ctx context.Context) (*Quote, error) {
	q := &Quote{}
	err := r.db.QueryRow(ctx, `
		SELECT id, text, author, category
		FROM quotes
		ORDER BY RANDOM()
		LIMIT 1
	`).Scan(&q.ID, &q.Text, &q.Author, &q.Category)
	if err != nil {
		return nil, fmt.Errorf("get random quote: %w", err)
	}
	return q, nil
}

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/quotes/random", h.GetRandom)
}

func (h *Handler) GetRandom(c *gin.Context) {
	quote, err := h.repo.GetRandom(c.Request.Context())
	if err != nil {
		response.InternalError(c, "could not fetch quote")
		return
	}
	response.OK(c, quote)
}
