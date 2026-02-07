package models

import (
	"time"

	"github.com/google/uuid"
)

type AnalysisHistory struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CoordinateID  uuid.UUID `gorm:"type:uuid;not null" json:"coordinate_id"`
	AnalysisType  string    `gorm:"type:varchar(50);not null" json:"analysis_type"`
	ResultSummary string    `gorm:"type:varchar(2000)" json:"result_summary"`
	ConfidenceAvg float64   `gorm:"not null" json:"confidence_avg"`
	ChangeCount   int       `gorm:"not null" json:"change_count"`
	CreatedAt     time.Time `json:"created_at"`
	User          User      `gorm:"foreignKey:UserID" json:"-"`
	Coordinate    Coordinate `gorm:"foreignKey:CoordinateID" json:"-"`
}

func (AnalysisHistory) TableName() string {
	return "analysis_histories"
}
