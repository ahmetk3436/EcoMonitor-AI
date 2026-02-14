package handlers

import (
	"errors"
	"time"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/models"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ExportHandler struct {
	exportService *services.ExportService
	db            *gorm.DB
}

func NewExportHandler(exportService *services.ExportService, db *gorm.DB) *ExportHandler {
	return &ExportHandler{
		exportService: exportService,
		db:            db,
	}
}

func (h *ExportHandler) ExportCSV(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	// Check subscription status (premium only)
	var subscription models.Subscription
	err = h.db.Where("user_id = ? AND status = ?", userID, "active").First(&subscription).Error
	if err != nil || subscription.CurrentPeriodEnd.Before(time.Now()) {
		if errors.Is(err, gorm.ErrRecordNotFound) || err == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "CSV export is a premium feature. Please upgrade to export your data.",
				"code":  "PREMIUM_REQUIRED",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to check subscription status",
		})
	}

	csvBytes, err := h.exportService.ExportUserDataCSV(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to generate export",
		})
	}

	timestamp := time.Now().Format("2006-01-02")
	filename := "ecomonitor-export-" + timestamp + ".csv"

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename="+filename)
	c.Set("Cache-Control", "no-cache")

	return c.Send(csvBytes)
}
