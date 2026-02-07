package handlers

import (
	"os"
	"time"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/database"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Check(c *fiber.Ctx) error {
	dbStatus := "ok"
	if err := database.Ping(); err != nil {
		dbStatus = "unhealthy: " + err.Error()
	}

	return c.JSON(dto.HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		DB:        dbStatus,
	})
}

func (h *HealthHandler) GetEnvironment(c *fiber.Ctx) error {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	return c.JSON(fiber.Map{
		"environment": env,
		"version":     "1.0.0",
		"features": fiber.Map{
			"satellite_analysis": true,
			"guest_mode":         true,
			"streak_system":      true,
			"history":            true,
		},
	})
}
