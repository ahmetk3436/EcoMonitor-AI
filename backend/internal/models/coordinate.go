package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Coordinate struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	Latitude    float64        `gorm:"type:decimal(10,8);not null" json:"latitude"`
	Longitude   float64        `gorm:"type:decimal(11,8);not null" json:"longitude"`
	Label       string         `gorm:"not null;size:255" json:"label"`
	Description string         `gorm:"size:500" json:"description,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	User        User           `gorm:"foreignKey:UserID" json:"-"`
}
