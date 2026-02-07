package middleware

import (
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func AdminRequired(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token, ok := c.Locals("user").(*jwt.Token)
		if !ok || token == nil {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error: true, Message: "admin access required",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error: true, Message: "admin access required",
			})
		}

		sub, ok := claims["sub"].(string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error: true, Message: "admin access required",
			})
		}

		userID, err := uuid.Parse(sub)
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error: true, Message: "admin access required",
			})
		}

		var user models.User
		if err := db.First(&user, "id = ?", userID).Error; err != nil {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error: true, Message: "admin access required",
			})
		}

		if user.Role != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error: true, Message: "admin access required",
			})
		}

		return c.Next()
	}
}
