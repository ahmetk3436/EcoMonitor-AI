package middleware

import (
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/dto"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AdminRequired middleware checks if the authenticated user has admin role.
// Must be used AFTER JWTProtected middleware in the route chain.
func AdminRequired(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Step 1: Extract JWT token from context (set by JWTProtected middleware)
		token, ok := c.Locals("user").(*jwt.Token)
		if !ok || token == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
				Error: true, Message: "Unauthorized - invalid token claims",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
				Error: true, Message: "Unauthorized - invalid token claims",
			})
		}

		sub, ok := claims["sub"].(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
				Error: true, Message: "Unauthorized - invalid token claims",
			})
		}

		userID, err := uuid.Parse(sub)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
				Error: true, Message: "Unauthorized - invalid token claims",
			})
		}

		// Step 2: Query User from database to get current role
		var user models.User
		if err := db.First(&user, "id = ?", userID).Error; err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
				Error: true, Message: "User not found",
			})
		}

		// Step 3: Check if user has admin role
		if user.Role != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error: true, Message: "Admin access required",
			})
		}

		// Step 4: User is admin, proceed to next handler
		return c.Next()
	}
}
