package dto

import (
	"time"

	"github.com/google/uuid"
)

type SatelliteDataResponse struct {
	ID           uuid.UUID `json:"id"`
	CoordinateID uuid.UUID `json:"coordinate_id"`
	ChangeType   string    `json:"change_type"`
	Confidence   float64   `json:"confidence"`
	DetectedAt   time.Time `json:"detected_at"`
	ImageURL     string    `json:"image_url"`
	Summary      string    `json:"summary"`
	Severity     string    `json:"severity"`
	AIModel      string    `json:"ai_model"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"created_at"`
}

type PaginatedSatelliteResponse struct {
	Data       []SatelliteDataResponse `json:"data"`
	Page       int                     `json:"page"`
	Limit      int                     `json:"limit"`
	TotalCount int64                   `json:"total_count"`
	TotalPages int                     `json:"total_pages"`
}

type AlertResponse struct {
	ID           uuid.UUID `json:"id"`
	CoordinateID uuid.UUID `json:"coordinate_id"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	ChangeType   string    `json:"change_type"`
	Confidence   float64   `json:"confidence"`
	DetectedAt   time.Time `json:"detected_at"`
	Summary      string    `json:"summary"`
	Severity     string    `json:"severity"`
	Description  string    `json:"description"`
}
