package user

import (
	"time"

	"github.com/google/uuid"
)

// User maps to the users table.
type User struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Age       *int      `json:"age"`
	HeightCM  *float64  `json:"height_cm"`
	WeightKG  *float64  `json:"weight_kg"`
	Onboarded bool      `json:"onboarded"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UserGoals maps to the user_goals table.
type UserGoals struct {
	ID                 uuid.UUID `json:"id"`
	UserID             uuid.UUID `json:"user_id"`
	DailyWaterML       int       `json:"daily_water_ml"`
	DailyProteinG      int       `json:"daily_protein_g"`
	DailySteps         int       `json:"daily_steps"`
	SleepHours         float64   `json:"sleep_hours"`
	WorkoutDaysWeek    int       `json:"workout_days_week"`
	MonthlySavingsINR  float64   `json:"monthly_savings_inr"`
	PriorityAreas      []string  `json:"priority_areas"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// --- Request DTOs ---

// CreateUserRequest is the body for POST /users
type CreateUserRequest struct {
	Name     string   `json:"name" binding:"required"`
	Age      *int     `json:"age"`
	HeightCM *float64 `json:"height_cm"`
	WeightKG *float64 `json:"weight_kg"`
}

// UpdateUserRequest is the body for PUT /users/:id
type UpdateUserRequest struct {
	Name     *string  `json:"name"`
	Age      *int     `json:"age"`
	HeightCM *float64 `json:"height_cm"`
	WeightKG *float64 `json:"weight_kg"`
}

// UpdateGoalsRequest is the body for PUT /users/:id/goals
type UpdateGoalsRequest struct {
	DailyWaterML      *int      `json:"daily_water_ml"`
	DailyProteinG     *int      `json:"daily_protein_g"`
	DailySteps        *int      `json:"daily_steps"`
	SleepHours        *float64  `json:"sleep_hours"`
	WorkoutDaysWeek   *int      `json:"workout_days_week"`
	MonthlySavingsINR *float64  `json:"monthly_savings_inr"`
	PriorityAreas     []string  `json:"priority_areas"`
}
