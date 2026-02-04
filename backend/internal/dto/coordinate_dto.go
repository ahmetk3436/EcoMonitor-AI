package dto

import "github.com/google/uuid"

type CreateCoordinateRequest struct {
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Label       string  `json:"label"`
	Description string  `json:"description"`
}

type UpdateCoordinateRequest struct {
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	Label       *string  `json:"label"`
	Description *string  `json:"description"`
}

type CoordinateResponse struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Label       string    `json:"label"`
	Description string    `json:"description,omitempty"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

type CoordinatesListResponse struct {
	Coordinates []CoordinateResponse `json:"coordinates"`
	Total       int64                `json:"total"`
	Page        int                  `json:"page"`
	Limit       int                  `json:"limit"`
	TotalPages  int                  `json:"total_pages"`
}
