package models

import (
	"time"

	"github.com/google/uuid"
)

type SatelliteData struct {
	ID           uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CoordinateID uuid.UUID  `gorm:"type:uuid;not null;index" json:"coordinate_id"`
	Coordinate   Coordinate `gorm:"foreignKey:CoordinateID" json:"-"`
	ChangeType   string     `gorm:"type:varchar(50);not null" json:"change_type"`
	Confidence   float64    `gorm:"not null;check:confidence >= 0 AND confidence <= 1" json:"confidence"`
	DetectedAt   time.Time  `gorm:"not null" json:"detected_at"`
	ImageURL     string     `gorm:"type:text" json:"image_url"`
	Summary      string     `gorm:"type:varchar(1000)" json:"summary"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (SatelliteData) TableName() string {
	return "satellite_data"
}
