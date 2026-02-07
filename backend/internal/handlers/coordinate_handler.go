package handlers

import (
	"errors"
	"strconv"

	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CoordinateHandler struct {
	coordinateService *services.CoordinateService
}

func NewCoordinateHandler(coordinateService *services.CoordinateService) *CoordinateHandler {
	return &CoordinateHandler{coordinateService: coordinateService}
}

func (h *CoordinateHandler) CreateCoordinate(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	var req dto.CreateCoordinateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error: true, Message: "Invalid request body",
		})
	}

	coord, err := h.coordinateService.CreateCoordinate(userID, &req)
	if err != nil {
		if errors.Is(err, services.ErrInvalidLatitude) ||
			errors.Is(err, services.ErrInvalidLongitude) ||
			errors.Is(err, services.ErrLabelRequired) ||
			errors.Is(err, services.ErrLabelTooLong) ||
			errors.Is(err, services.ErrDescriptionTooLong) {
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error: true, Message: err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to create coordinate",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(coord)
}

func (h *CoordinateHandler) ListCoordinates(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	search := c.Query("search", "")

	var coords *dto.CoordinatesListResponse
	if search != "" {
		coords, err = h.coordinateService.ListCoordinatesWithSearch(userID, page, limit, search)
	} else {
		coords, err = h.coordinateService.ListCoordinates(userID, page, limit)
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to fetch coordinates",
		})
	}

	return c.JSON(coords)
}

func (h *CoordinateHandler) UpdateCoordinate(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error: true, Message: "Invalid coordinate ID",
		})
	}

	var req dto.UpdateCoordinateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error: true, Message: "Invalid request body",
		})
	}

	coord, err := h.coordinateService.UpdateCoordinate(id, userID, &req)
	if err != nil {
		if errors.Is(err, services.ErrCoordinateNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error: true, Message: err.Error(),
			})
		}
		if errors.Is(err, services.ErrInvalidLatitude) ||
			errors.Is(err, services.ErrInvalidLongitude) ||
			errors.Is(err, services.ErrLabelRequired) ||
			errors.Is(err, services.ErrLabelTooLong) ||
			errors.Is(err, services.ErrDescriptionTooLong) {
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error: true, Message: err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to update coordinate",
		})
	}

	return c.JSON(coord)
}

func (h *CoordinateHandler) GetCoordinate(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error: true, Message: "Invalid coordinate ID",
		})
	}

	coord, err := h.coordinateService.GetCoordinate(id)
	if err != nil {
		if errors.Is(err, services.ErrCoordinateNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error: true, Message: err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to fetch coordinate",
		})
	}

	return c.JSON(coord)
}

func (h *CoordinateHandler) DeleteCoordinate(c *fiber.Ctx) error {
	userID, err := extractUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: true, Message: "Unauthorized",
		})
	}

	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error: true, Message: "Invalid coordinate ID",
		})
	}

	if err := h.coordinateService.DeleteCoordinate(id, userID); err != nil {
		if errors.Is(err, services.ErrCoordinateNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error: true, Message: err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error: true, Message: "Failed to delete coordinate",
		})
	}

	return c.JSON(fiber.Map{"message": "Coordinate deleted successfully"})
}
