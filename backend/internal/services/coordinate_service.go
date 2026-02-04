package services

import (
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrCoordinateNotFound = errors.New("coordinate not found")
	ErrInvalidLatitude    = errors.New("latitude must be between -90 and 90")
	ErrInvalidLongitude   = errors.New("longitude must be between -180 and 180")
	ErrLabelRequired      = errors.New("label is required")
	ErrLabelTooLong       = errors.New("label must be at most 255 characters")
	ErrDescriptionTooLong = errors.New("description must be at most 500 characters")
)

type CoordinateService struct {
	db *gorm.DB
}

func NewCoordinateService(db *gorm.DB) *CoordinateService {
	return &CoordinateService{db: db}
}

func (s *CoordinateService) CreateCoordinate(userID uuid.UUID, req *dto.CreateCoordinateRequest) (*dto.CoordinateResponse, error) {
	if err := validateCoordinateInput(req.Latitude, req.Longitude, req.Label, req.Description); err != nil {
		return nil, err
	}

	coordinate := models.Coordinate{
		ID:          uuid.New(),
		UserID:      userID,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Label:       req.Label,
		Description: req.Description,
	}

	if err := s.db.Create(&coordinate).Error; err != nil {
		return nil, fmt.Errorf("failed to create coordinate: %w", err)
	}

	return mapCoordinateToResponse(&coordinate), nil
}

func (s *CoordinateService) ListCoordinates(userID uuid.UUID, page, limit int) (*dto.CoordinatesListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	var coordinates []models.Coordinate
	var total int64

	query := s.db.Model(&models.Coordinate{}).Where("user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&coordinates).Error; err != nil {
		return nil, err
	}

	response := &dto.CoordinatesListResponse{
		Coordinates: make([]dto.CoordinateResponse, len(coordinates)),
		Total:       total,
		Page:        page,
		Limit:       limit,
		TotalPages:  int(math.Ceil(float64(total) / float64(limit))),
	}

	for i, coord := range coordinates {
		response.Coordinates[i] = *mapCoordinateToResponse(&coord)
	}

	return response, nil
}

func (s *CoordinateService) GetCoordinate(id uuid.UUID) (*dto.CoordinateResponse, error) {
	var coordinate models.Coordinate
	if err := s.db.First(&coordinate, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoordinateNotFound
		}
		return nil, err
	}
	return mapCoordinateToResponse(&coordinate), nil
}

func (s *CoordinateService) DeleteCoordinate(id, userID uuid.UUID) error {
	result := s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Coordinate{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrCoordinateNotFound
	}
	return nil
}

func validateCoordinateInput(lat, lng float64, label, description string) error {
	if lat < -90 || lat > 90 {
		return ErrInvalidLatitude
	}
	if lng < -180 || lng > 180 {
		return ErrInvalidLongitude
	}
	if strings.TrimSpace(label) == "" {
		return ErrLabelRequired
	}
	if len(label) > 255 {
		return ErrLabelTooLong
	}
	if len(description) > 500 {
		return ErrDescriptionTooLong
	}
	return nil
}

func mapCoordinateToResponse(coord *models.Coordinate) *dto.CoordinateResponse {
	return &dto.CoordinateResponse{
		ID:          coord.ID,
		UserID:      coord.UserID,
		Latitude:    coord.Latitude,
		Longitude:   coord.Longitude,
		Label:       coord.Label,
		Description: coord.Description,
		CreatedAt:   coord.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   coord.UpdatedAt.Format(time.RFC3339),
	}
}
