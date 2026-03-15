package period

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// LogDay inserts or updates a period day entry (upsert by user_id + log_date).
func (r *Repository) LogDay(ctx context.Context, userID uuid.UUID, req LogPeriodDayRequest) (*PeriodDay, error) {
	d := &PeriodDay{}
	err := r.db.QueryRow(ctx, `
		INSERT INTO period_days (user_id, log_date, flow_level, symptoms, mood, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, log_date) DO UPDATE SET
			flow_level = COALESCE($3, period_days.flow_level),
			symptoms   = COALESCE($4, period_days.symptoms),
			mood       = COALESCE($5, period_days.mood),
			notes      = COALESCE($6, period_days.notes)
		RETURNING id, user_id, log_date::TEXT, flow_level, symptoms, mood, notes, created_at
	`, userID, req.LogDate, req.FlowLevel, req.Symptoms, req.Mood, req.Notes).Scan(
		&d.ID, &d.UserID, &d.LogDate, &d.FlowLevel, &d.Symptoms, &d.Mood, &d.Notes, &d.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("log period day: %w", err)
	}
	return d, nil
}

// DeleteDay removes a period day entry.
func (r *Repository) DeleteDay(ctx context.Context, userID uuid.UUID, date string) error {
	result, err := r.db.Exec(ctx, `
		DELETE FROM period_days WHERE user_id = $1 AND log_date = $2
	`, userID, date)
	if err != nil {
		return fmt.Errorf("delete period day: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("no period day found for date %s", date)
	}
	return nil
}

// GetLogs returns period days in a date range.
func (r *Repository) GetLogs(ctx context.Context, userID uuid.UUID, from, to string) ([]PeriodDay, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, log_date::TEXT, flow_level, symptoms, mood, notes, created_at
		FROM period_days
		WHERE user_id = $1 AND log_date BETWEEN $2 AND $3
		ORDER BY log_date ASC
	`, userID, from, to)
	if err != nil {
		return nil, fmt.Errorf("get period logs: %w", err)
	}
	defer rows.Close()

	var days []PeriodDay
	for rows.Next() {
		var d PeriodDay
		if err := rows.Scan(
			&d.ID, &d.UserID, &d.LogDate, &d.FlowLevel, &d.Symptoms, &d.Mood, &d.Notes, &d.CreatedAt,
		); err != nil {
			return nil, err
		}
		days = append(days, d)
	}
	return days, rows.Err()
}

// UpsertProfile saves or updates period profile (from onboarding).
func (r *Repository) UpsertProfile(ctx context.Context, userID uuid.UUID, req UpsertProfileRequest) (*PeriodProfile, error) {
	p := &PeriodProfile{}
	err := r.db.QueryRow(ctx, `
		INSERT INTO period_profile
			(user_id, avg_cycle_length, avg_period_duration, last_period_start, relationship_with_period)
		VALUES ($1, COALESCE($2, 28), COALESCE($3, 5), $4, COALESCE($5, 'neutral'))
		ON CONFLICT (user_id) DO UPDATE SET
			avg_cycle_length        = COALESCE($2, period_profile.avg_cycle_length),
			avg_period_duration     = COALESCE($3, period_profile.avg_period_duration),
			last_period_start       = COALESCE($4, period_profile.last_period_start),
			relationship_with_period = COALESCE($5, period_profile.relationship_with_period),
			updated_at              = $6
		RETURNING id, user_id, avg_cycle_length, avg_period_duration,
		          last_period_start::TEXT, relationship_with_period, created_at, updated_at
	`, userID, req.AvgCycleLength, req.AvgPeriodDuration,
		req.LastPeriodStart, req.RelationshipWithPeriod, time.Now(),
	).Scan(
		&p.ID, &p.UserID, &p.AvgCycleLength, &p.AvgPeriodDuration,
		&p.LastPeriodStart, &p.RelationshipWithPeriod, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("upsert period profile: %w", err)
	}
	return p, nil
}

// GetProfile fetches the period profile for a user.
func (r *Repository) GetProfile(ctx context.Context, userID uuid.UUID) (*PeriodProfile, error) {
	p := &PeriodProfile{}
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, avg_cycle_length, avg_period_duration,
		       last_period_start::TEXT, relationship_with_period, created_at, updated_at
		FROM period_profile WHERE user_id = $1
	`, userID).Scan(
		&p.ID, &p.UserID, &p.AvgCycleLength, &p.AvgPeriodDuration,
		&p.LastPeriodStart, &p.RelationshipWithPeriod, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get period profile: %w", err)
	}
	return p, nil
}
