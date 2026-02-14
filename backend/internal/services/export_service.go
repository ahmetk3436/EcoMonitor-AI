package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ExportService struct {
	db *gorm.DB
}

type CoordinateWithSatelliteData struct {
	ID         uuid.UUID `gorm:"column:id"`
	Label      string    `gorm:"column:label"`
	Latitude   float64   `gorm:"column:latitude"`
	Longitude  float64   `gorm:"column:longitude"`
	ChangeType string    `gorm:"column:change_type"`
	Confidence float64   `gorm:"column:confidence"`
	Severity   string    `gorm:"column:severity"`
	Summary    string    `gorm:"column:summary"`
	DetectedAt time.Time `gorm:"column:detected_at"`
}

func NewExportService(db *gorm.DB) *ExportService {
	return &ExportService{db: db}
}

func (s *ExportService) ExportUserDataCSV(userID uuid.UUID) ([]byte, error) {
	var data []CoordinateWithSatelliteData

	err := s.db.Table("coordinates").
		Select(`
			coordinates.id,
			coordinates.label,
			coordinates.latitude,
			coordinates.longitude,
			satellite_data.change_type,
			satellite_data.confidence,
			satellite_data.severity,
			satellite_data.summary,
			satellite_data.detected_at
		`).
		Joins("LEFT JOIN satellite_data ON satellite_data.coordinate_id = coordinates.id").
		Where("coordinates.user_id = ? AND coordinates.deleted_at IS NULL", userID).
		Order("satellite_data.detected_at DESC").
		Find(&data).Error

	if err != nil {
		return nil, fmt.Errorf("failed to query user data: %w", err)
	}

	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)

	headers := []string{
		"Location",
		"Latitude",
		"Longitude",
		"Change Type",
		"Confidence",
		"Severity",
		"Summary",
		"Detected At",
	}
	if err := writer.Write(headers); err != nil {
		return nil, fmt.Errorf("failed to write CSV headers: %w", err)
	}

	for _, row := range data {
		detectedAtStr := ""
		if !row.DetectedAt.IsZero() {
			detectedAtStr = row.DetectedAt.Format("2006-01-02 15:04:05")
		}

		record := []string{
			row.Label,
			fmt.Sprintf("%.6f", row.Latitude),
			fmt.Sprintf("%.6f", row.Longitude),
			row.ChangeType,
			fmt.Sprintf("%.2f", row.Confidence),
			row.Severity,
			row.Summary,
			detectedAtStr,
		}
		if err := writer.Write(record); err != nil {
			return nil, fmt.Errorf("failed to write CSV record: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, fmt.Errorf("CSV writer error: %w", err)
	}

	return buffer.Bytes(), nil
}
