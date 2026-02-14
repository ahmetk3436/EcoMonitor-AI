package handlers

import (
	"errors"
	"strconv"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SatelliteHandler struct {
	satelliteService *services.SatelliteService
}

func NewSatelliteHandler(satelliteService *services.SatelliteService) *SatelliteHandler {
	return &SatelliteHandler{satelliteService: satelliteService}
}

func (h *SatelliteHandler) GenerateAnalysis(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	idStr := c.Params("id")
	coordinateID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error: true, Message: "Invalid coordinate ID",
		})
	}

	results, err := h.satelliteService.AnalyzeCoordinate(coordinateID, userID)
	if err != nil {
		if errors.Is(err, services.ErrAIServiceNotConfigured) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(dto.ErrorResponse{
				Error: true, Message: "AI analysis service not configured. Please contact support.",
			})
		}
		if errors.Is(err, services.ErrCoordinateNotFoundForAnalysis) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error: true, Message: "Coordinate not found or you don't have access to it",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Analysis failed: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Analysis generated successfully",
		"data":    results,
	})
}

func (h *SatelliteHandler) GetAnalysisForCoordinate(c *fiber.Ctx) error {
	idStr := c.Params("id")
	coordinateID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error: true, Message: "Invalid coordinate ID",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	results, err := h.satelliteService.GetAnalysisForCoordinate(coordinateID, page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to fetch analysis",
		})
	}

	return c.JSON(results)
}

func (h *SatelliteHandler) GetLatestAlerts(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	alerts, err := h.satelliteService.GetLatestAlerts(userID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to fetch alerts",
		})
	}

	return c.JSON(fiber.Map{"alerts": alerts})
}
