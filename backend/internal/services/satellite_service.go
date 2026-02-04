package services

import (
	"errors"
	"math"
	"math/rand"
	"time"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrCoordinateNotFoundForAnalysis = errors.New("coordinate not found")

type SatelliteService struct {
	db *gorm.DB
}

func NewSatelliteService(db *gorm.DB) *SatelliteService {
	return &SatelliteService{db: db}
}

func (s *SatelliteService) GenerateDummyAnalysis(coordinateID uuid.UUID) ([]dto.SatelliteDataResponse, error) {
	// Verify coordinate exists
	var coord models.Coordinate
	if err := s.db.First(&coord, "id = ?", coordinateID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoordinateNotFoundForAnalysis
		}
		return nil, err
	}

	changeTypes := []string{"construction", "vegetation_loss", "water_change", "urban_expansion"}
	descriptions := map[string]string{
		"construction":    "New construction activity detected in the area",
		"vegetation_loss": "Significant vegetation loss observed",
		"water_change":    "Water body changes detected",
		"urban_expansion": "Urban expansion identified",
	}

	numEntries := rand.Intn(5) + 1
	results := make([]dto.SatelliteDataResponse, 0, numEntries)

	for i := 0; i < numEntries; i++ {
		changeType := changeTypes[rand.Intn(len(changeTypes))]
		confidence := math.Round((0.5+rand.Float64()*0.5)*100) / 100

		satelliteData := models.SatelliteData{
			CoordinateID: coordinateID,
			ChangeType:   changeType,
			Confidence:   confidence,
			DetectedAt:   time.Now().Add(-time.Duration(rand.Intn(30)) * 24 * time.Hour),
			ImageURL:     "https://example.com/satellite-image-placeholder.jpg",
			Summary:      descriptions[changeType],
		}

		if err := s.db.Create(&satelliteData).Error; err != nil {
			return nil, err
		}

		results = append(results, mapSatelliteToResponse(&satelliteData))
	}

	return results, nil
}

func (s *SatelliteService) GetAnalysisForCoordinate(coordinateID uuid.UUID, page, limit int) (*dto.PaginatedSatelliteResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	var totalCount int64
	query := s.db.Model(&models.SatelliteData{}).Where("coordinate_id = ?", coordinateID)

	if err := query.Count(&totalCount).Error; err != nil {
		return nil, err
	}

	var satelliteData []models.SatelliteData
	if err := query.Order("detected_at DESC").Offset(offset).Limit(limit).Find(&satelliteData).Error; err != nil {
		return nil, err
	}

	responseData := make([]dto.SatelliteDataResponse, len(satelliteData))
	for i, data := range satelliteData {
		responseData[i] = mapSatelliteToResponse(&data)
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(limit)))

	return &dto.PaginatedSatelliteResponse{
		Data:       responseData,
		Page:       page,
		Limit:      limit,
		TotalCount: totalCount,
		TotalPages: totalPages,
	}, nil
}

func (s *SatelliteService) GetLatestAlerts(userID uuid.UUID, limit int) ([]dto.AlertResponse, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var results []struct {
		ID           uuid.UUID
		CoordinateID uuid.UUID
		ChangeType   string
		Confidence   float64
		DetectedAt   time.Time
		Summary      string
		Latitude     float64
		Longitude    float64
	}

	err := s.db.Table("satellite_data").
		Select("satellite_data.id, satellite_data.coordinate_id, satellite_data.change_type, satellite_data.confidence, satellite_data.detected_at, satellite_data.summary, coordinates.latitude, coordinates.longitude").
		Joins("JOIN coordinates ON satellite_data.coordinate_id = coordinates.id").
		Where("coordinates.user_id = ? AND coordinates.deleted_at IS NULL", userID).
		Order("satellite_data.detected_at DESC").
		Limit(limit).
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	alerts := make([]dto.AlertResponse, len(results))
	for i, r := range results {
		alerts[i] = dto.AlertResponse{
			ID:           r.ID,
			CoordinateID: r.CoordinateID,
			Latitude:     r.Latitude,
			Longitude:    r.Longitude,
			ChangeType:   r.ChangeType,
			Confidence:   r.Confidence,
			DetectedAt:   r.DetectedAt,
			Summary:      r.Summary,
		}
	}

	return alerts, nil
}

func mapSatelliteToResponse(data *models.SatelliteData) dto.SatelliteDataResponse {
	return dto.SatelliteDataResponse{
		ID:           data.ID,
		CoordinateID: data.CoordinateID,
		ChangeType:   data.ChangeType,
		Confidence:   data.Confidence,
		DetectedAt:   data.DetectedAt,
		ImageURL:     data.ImageURL,
		Summary:      data.Summary,
		CreatedAt:    data.CreatedAt,
	}
}
