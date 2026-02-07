package services

import (
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type HistoryService struct {
	db *gorm.DB
}

func NewHistoryService(db *gorm.DB) *HistoryService {
	return &HistoryService{db: db}
}

func (s *HistoryService) RecordAnalysis(userID, coordinateID uuid.UUID, analysisType string, results []dto.SatelliteDataResponse) error {
	if len(results) == 0 {
		return nil
	}

	var totalConfidence float64
	summaries := make([]string, 0, len(results))
	for _, r := range results {
		totalConfidence += r.Confidence
		summaries = append(summaries, fmt.Sprintf("%s (%.0f%%)", r.ChangeType, r.Confidence*100))
	}

	avgConfidence := totalConfidence / float64(len(results))
	resultSummary := strings.Join(summaries, "; ")
	if len(resultSummary) > 2000 {
		resultSummary = resultSummary[:1997] + "..."
	}

	history := models.AnalysisHistory{
		ID:            uuid.New(),
		UserID:        userID,
		CoordinateID:  coordinateID,
		AnalysisType:  analysisType,
		ResultSummary: resultSummary,
		ConfidenceAvg: math.Round(avgConfidence*100) / 100,
		ChangeCount:   len(results),
	}

	if err := s.db.Create(&history).Error; err != nil {
		return fmt.Errorf("failed to record analysis history: %w", err)
	}

	return nil
}

func (s *HistoryService) GetUserHistory(userID uuid.UUID, page, limit int) (*dto.PaginatedHistoryResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}
	offset := (page - 1) * limit

	var totalCount int64
	if err := s.db.Model(&models.AnalysisHistory{}).Where("user_id = ?", userID).Count(&totalCount).Error; err != nil {
		return nil, err
	}

	var results []struct {
		ID            uuid.UUID
		AnalysisType  string
		ResultSummary string
		ConfidenceAvg float64
		ChangeCount   int
		CreatedAt     time.Time
		Label         string
	}

	err := s.db.Table("analysis_histories").
		Select("analysis_histories.id, analysis_histories.analysis_type, analysis_histories.result_summary, analysis_histories.confidence_avg, analysis_histories.change_count, analysis_histories.created_at, coordinates.label").
		Joins("LEFT JOIN coordinates ON analysis_histories.coordinate_id = coordinates.id").
		Where("analysis_histories.user_id = ?", userID).
		Order("analysis_histories.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	data := make([]dto.HistoryResponse, len(results))
	for i, r := range results {
		data[i] = dto.HistoryResponse{
			ID:              r.ID,
			CoordinateLabel: r.Label,
			AnalysisType:    r.AnalysisType,
			ResultSummary:   r.ResultSummary,
			ConfidenceAvg:   r.ConfidenceAvg,
			ChangeCount:     r.ChangeCount,
			CreatedAt:       r.CreatedAt.Format(time.RFC3339),
		}
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(limit)))

	return &dto.PaginatedHistoryResponse{
		Data:       data,
		Page:       page,
		Limit:      limit,
		TotalCount: totalCount,
		TotalPages: totalPages,
	}, nil
}
