package handlers

import (
	"strconv"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type HistoryHandler struct {
	historyService *services.HistoryService
}

func NewHistoryHandler(historyService *services.HistoryService) *HistoryHandler {
	return &HistoryHandler{historyService: historyService}
}

func (h *HistoryHandler) GetHistory(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if limit > 50 {
		limit = 50
	}

	history, err := h.historyService.GetUserHistory(userID, page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to fetch history",
		})
	}

	return c.JSON(history)
}
