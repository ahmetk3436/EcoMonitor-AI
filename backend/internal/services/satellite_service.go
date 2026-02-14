package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/config"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrCoordinateNotFoundForAnalysis = errors.New("coordinate not found")
var ErrAIServiceNotConfigured = errors.New("AI analysis service not configured")

// OpenAI API request/response types

type openAIRequest struct {
	Model       string           `json:"model"`
	Messages    []openAIMessage  `json:"messages"`
	Temperature float64          `json:"temperature"`
	MaxTokens   int              `json:"max_tokens"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
}

type environmentalChange struct {
	ChangeType  string  `json:"change_type"`
	Confidence  float64 `json:"confidence"`
	Summary     string  `json:"summary"`
	Severity    string  `json:"severity"`
	Description string  `json:"description"`
	DetectedAt  string  `json:"detected_at"`
}

type SatelliteService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewSatelliteService(db *gorm.DB, cfg *config.Config) *SatelliteService {
	return &SatelliteService{db: db, cfg: cfg}
}

// AnalyzeCoordinate performs AI-powered environmental analysis for a given coordinate
func (s *SatelliteService) AnalyzeCoordinate(coordinateID uuid.UUID, userID uuid.UUID) ([]dto.SatelliteDataResponse, error) {
	if s.cfg.OpenAIAPIKey == "" {
		return nil, ErrAIServiceNotConfigured
	}

	// Fetch the coordinate from database
	var coord models.Coordinate
	if err := s.db.Where("id = ? AND user_id = ?", coordinateID, userID).First(&coord).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoordinateNotFoundForAnalysis
		}
		return nil, fmt.Errorf("failed to fetch coordinate: %w", err)
	}

	// Determine model based on user subscription
	model := "gpt-4o-mini"
	var subscription models.Subscription
	if err := s.db.Where("user_id = ? AND status = ?", userID, "active").First(&subscription).Error; err == nil {
		model = "gpt-4o"
	}

	// Build the prompt
	prompt := fmt.Sprintf(`You are an environmental analysis AI. Analyze the area at latitude %.6f, longitude %.6f (%s). Based on your knowledge of this geographic region, provide a realistic environmental change assessment.

Return a JSON array with objects containing:
- change_type: one of [construction, vegetation_loss, water_change, urban_expansion, deforestation, pollution, flooding, erosion, wildfire_risk, biodiversity_loss]
- confidence: a float between 0.0 and 1.0
- summary: a 2-3 sentence description of the specific change detected at this location
- severity: one of [low, medium, high, critical] indicating the urgency level
- description: a detailed paragraph (3-5 sentences) with in-depth analysis of the environmental change, its causes, and potential impacts
- detected_at: an ISO8601 date within the last 30 days

Provide 1-4 realistic entries based on what environmental changes are plausible for this region. Return ONLY valid JSON, no markdown formatting or explanation.`, coord.Latitude, coord.Longitude, coord.Label)

	// Call OpenAI API
	openAIReq := openAIRequest{
		Model: model,
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: "You are an environmental analysis AI that returns only valid JSON arrays. Do not include any text outside the JSON array.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   1500,
	}

	reqBody, err := json.Marshal(openAIReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.cfg.OpenAIAPIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI API: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(httpResp.Body)
		return nil, fmt.Errorf("OpenAI API error (status %d): %s", httpResp.StatusCode, string(bodyBytes))
	}

	var openAIResp openAIResponse
	if err := json.NewDecoder(httpResp.Body).Decode(&openAIResp); err != nil {
		return nil, fmt.Errorf("failed to decode OpenAI response: %w", err)
	}

	if len(openAIResp.Choices) == 0 {
		return nil, errors.New("no response from OpenAI")
	}

	// Parse the environmental changes from response
	content := cleanJSONContent(openAIResp.Choices[0].Message.Content)

	var changes []environmentalChange
	if err := json.Unmarshal([]byte(content), &changes); err != nil {
		return nil, fmt.Errorf("failed to parse environmental changes: %w", err)
	}

	// Validate and create SatelliteData records
	validChangeTypes := map[string]bool{
		"construction":     true,
		"vegetation_loss":  true,
		"water_change":     true,
		"urban_expansion":  true,
		"deforestation":    true,
		"pollution":        true,
		"flooding":         true,
		"erosion":          true,
		"wildfire_risk":    true,
		"biodiversity_loss": true,
	}

	validSeverities := map[string]bool{
		"low":      true,
		"medium":   true,
		"high":     true,
		"critical": true,
	}

	var results []dto.SatelliteDataResponse

	for _, change := range changes {
		if !validChangeTypes[change.ChangeType] {
			continue
		}

		if change.Confidence < 0.0 || change.Confidence > 1.0 {
			change.Confidence = 0.5
		}

		detectedAt, err := time.Parse(time.RFC3339, change.DetectedAt)
		if err != nil {
			detectedAt, err = time.Parse("2006-01-02", change.DetectedAt)
			if err != nil {
				detectedAt = time.Now().AddDate(0, 0, -1)
			}
		}

		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
		if detectedAt.Before(thirtyDaysAgo) || detectedAt.After(time.Now()) {
			detectedAt = time.Now().AddDate(0, 0, -1)
		}

		// Validate and default severity
		severity := change.Severity
		if !validSeverities[severity] {
			severity = "medium"
		}

		satelliteData := models.SatelliteData{
			CoordinateID: coordinateID,
			ChangeType:   change.ChangeType,
			Confidence:   change.Confidence,
			Summary:      change.Summary,
			Severity:     severity,
			AIModel:      model,
			Description:  change.Description,
			DetectedAt:   detectedAt,
			ImageURL:     "",
		}

		if err := s.db.Create(&satelliteData).Error; err != nil {
			return nil, fmt.Errorf("failed to create satellite data: %w", err)
		}

		results = append(results, mapSatelliteToResponse(&satelliteData))
	}

	if len(results) == 0 {
		return nil, errors.New("no valid environmental changes detected for this location")
	}

	return results, nil
}

// cleanJSONContent removes markdown code blocks and trims whitespace
func cleanJSONContent(content string) string {
	content = strings.TrimSpace(content)

	if strings.HasPrefix(content, "```json") {
		content = strings.TrimPrefix(content, "```json")
	} else if strings.HasPrefix(content, "```") {
		content = strings.TrimPrefix(content, "```")
	}

	if strings.HasSuffix(content, "```") {
		content = strings.TrimSuffix(content, "```")
	}

	return strings.TrimSpace(content)
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

func (s *SatelliteService) GetLatestAlerts(userID uuid.UUID, limit int, severityFilter string) ([]dto.AlertResponse, error) {
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
		Severity     string
		Description  string
		Latitude     float64
		Longitude    float64
	}

	query := s.db.Table("satellite_data").
		Select("satellite_data.id, satellite_data.coordinate_id, satellite_data.change_type, satellite_data.confidence, satellite_data.detected_at, satellite_data.summary, satellite_data.severity, satellite_data.description, coordinates.latitude, coordinates.longitude").
		Joins("JOIN coordinates ON satellite_data.coordinate_id = coordinates.id").
		Where("coordinates.user_id = ? AND coordinates.deleted_at IS NULL", userID)

	if severityFilter != "" && severityFilter != "all" {
		query = query.Where("satellite_data.severity = ?", severityFilter)
	}

	err := query.Order("satellite_data.detected_at DESC").
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
			Severity:     r.Severity,
			Description:  r.Description,
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
		Severity:     data.Severity,
		AIModel:      data.AIModel,
		Description:  data.Description,
		CreatedAt:    data.CreatedAt,
	}
}
