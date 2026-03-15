package period

import (
	"time"

	"github.com/google/uuid"
)

type PeriodDay struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	LogDate    string    `json:"log_date"` // "YYYY-MM-DD"
	FlowLevel  *string   `json:"flow_level"`
	Symptoms   []string  `json:"symptoms"`
	Mood       *string   `json:"mood"`
	Notes      *string   `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
}

type PeriodProfile struct {
	ID                      uuid.UUID `json:"id"`
	UserID                  uuid.UUID `json:"user_id"`
	AvgCycleLength          int       `json:"avg_cycle_length"`
	AvgPeriodDuration       int       `json:"avg_period_duration"`
	LastPeriodStart         *string   `json:"last_period_start"`
	RelationshipWithPeriod  string    `json:"relationship_with_period"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

// --- Request DTOs ---

type LogPeriodDayRequest struct {
	LogDate   string   `json:"log_date" binding:"required"` // "YYYY-MM-DD"
	FlowLevel *string  `json:"flow_level"`
	Symptoms  []string `json:"symptoms"`
	Mood      *string  `json:"mood"`
	Notes     *string  `json:"notes"`
}

type UpsertProfileRequest struct {
	AvgCycleLength         *int    `json:"avg_cycle_length"`
	AvgPeriodDuration      *int    `json:"avg_period_duration"`
	LastPeriodStart        *string `json:"last_period_start"`
	RelationshipWithPeriod *string `json:"relationship_with_period"`
}

type GetLogsQuery struct {
	From string `form:"from"` // "YYYY-MM-DD"
	To   string `form:"to"`   // "YYYY-MM-DD"
}
