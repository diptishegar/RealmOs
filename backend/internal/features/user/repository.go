package user

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles all database operations for users.
// No business logic here — that lives in the service layer.
type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
	u := &User{}
	err := r.db.QueryRow(ctx, `
		INSERT INTO users (name, age, height_cm, weight_kg)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, age, height_cm, weight_kg, onboarded, created_at, updated_at
	`, req.Name, req.Age, req.HeightCM, req.WeightKG).Scan(
		&u.ID, &u.Name, &u.Age, &u.HeightCM, &u.WeightKG,
		&u.Onboarded, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return u, nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	u := &User{}
	err := r.db.QueryRow(ctx, `
		SELECT id, name, age, height_cm, weight_kg, onboarded, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(
		&u.ID, &u.Name, &u.Age, &u.HeightCM, &u.WeightKG,
		&u.Onboarded, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	return u, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateUserRequest) (*User, error) {
	u := &User{}
	err := r.db.QueryRow(ctx, `
		UPDATE users
		SET name      = COALESCE($1, name),
		    age       = COALESCE($2, age),
		    height_cm = COALESCE($3, height_cm),
		    weight_kg = COALESCE($4, weight_kg),
		    updated_at = $5
		WHERE id = $6
		RETURNING id, name, age, height_cm, weight_kg, onboarded, created_at, updated_at
	`, req.Name, req.Age, req.HeightCM, req.WeightKG, time.Now(), id).Scan(
		&u.ID, &u.Name, &u.Age, &u.HeightCM, &u.WeightKG,
		&u.Onboarded, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}
	return u, nil
}

func (r *Repository) MarkOnboarded(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET onboarded = TRUE, updated_at = NOW() WHERE id = $1
	`, id)
	return err
}

func (r *Repository) UpsertGoals(ctx context.Context, userID uuid.UUID, req UpdateGoalsRequest) (*UserGoals, error) {
	g := &UserGoals{}
	err := r.db.QueryRow(ctx, `
		INSERT INTO user_goals
			(user_id, daily_water_ml, daily_protein_g, daily_steps, sleep_hours,
			 workout_days_week, monthly_savings_inr, priority_areas)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id) DO UPDATE SET
			daily_water_ml      = COALESCE($2, user_goals.daily_water_ml),
			daily_protein_g     = COALESCE($3, user_goals.daily_protein_g),
			daily_steps         = COALESCE($4, user_goals.daily_steps),
			sleep_hours         = COALESCE($5, user_goals.sleep_hours),
			workout_days_week   = COALESCE($6, user_goals.workout_days_week),
			monthly_savings_inr = COALESCE($7, user_goals.monthly_savings_inr),
			priority_areas      = COALESCE($8, user_goals.priority_areas),
			updated_at          = NOW()
		RETURNING id, user_id, daily_water_ml, daily_protein_g, daily_steps,
		          sleep_hours, workout_days_week, monthly_savings_inr,
		          priority_areas, created_at, updated_at
	`, userID,
		req.DailyWaterML, req.DailyProteinG, req.DailySteps, req.SleepHours,
		req.WorkoutDaysWeek, req.MonthlySavingsINR, req.PriorityAreas,
	).Scan(
		&g.ID, &g.UserID, &g.DailyWaterML, &g.DailyProteinG, &g.DailySteps,
		&g.SleepHours, &g.WorkoutDaysWeek, &g.MonthlySavingsINR,
		&g.PriorityAreas, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("upsert goals: %w", err)
	}
	return g, nil
}

func (r *Repository) GetGoals(ctx context.Context, userID uuid.UUID) (*UserGoals, error) {
	g := &UserGoals{}
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, daily_water_ml, daily_protein_g, daily_steps,
		       sleep_hours, workout_days_week, monthly_savings_inr,
		       priority_areas, created_at, updated_at
		FROM user_goals WHERE user_id = $1
	`, userID).Scan(
		&g.ID, &g.UserID, &g.DailyWaterML, &g.DailyProteinG, &g.DailySteps,
		&g.SleepHours, &g.WorkoutDaysWeek, &g.MonthlySavingsINR,
		&g.PriorityAreas, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get goals: %w", err)
	}
	return g, nil
}
