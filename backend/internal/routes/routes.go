package routes

import (
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/config"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/handlers"
	"github.com/ahmetk3436/EcoMonitor-AI/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(
	app *fiber.App,
	cfg *config.Config,
	db *gorm.DB,
	authHandler *handlers.AuthHandler,
	healthHandler *handlers.HealthHandler,
	webhookHandler *handlers.WebhookHandler,
	moderationHandler *handlers.ModerationHandler,
	coordinateHandler *handlers.CoordinateHandler,
	satelliteHandler *handlers.SatelliteHandler,
	historyHandler *handlers.HistoryHandler,
	legalHandler *handlers.LegalHandler,
	exportHandler *handlers.ExportHandler,
) {
	api := app.Group("/api")

	// Legal pages (public, required for App Store)
	api.Get("/privacy-policy", legalHandler.PrivacyPolicy)
	api.Get("/terms", legalHandler.TermsOfService)

	// Health
	api.Get("/health", healthHandler.Check)
	api.Get("/env", healthHandler.GetEnvironment)

	// Auth (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/apple", authHandler.AppleSignIn) // Sign in with Apple (Guideline 4.8)

	// Auth (protected)
	protected := api.Group("", middleware.JWTProtected(cfg))
	protected.Post("/auth/logout", authHandler.Logout)
	protected.Delete("/auth/account", authHandler.DeleteAccount) // Account deletion (Guideline 5.1.1)

	// Moderation - User endpoints (protected)
	protected.Post("/reports", moderationHandler.CreateReport)     // Report content (Guideline 1.2)
	protected.Post("/blocks", moderationHandler.BlockUser)         // Block user (Guideline 1.2)
	protected.Delete("/blocks/:id", moderationHandler.UnblockUser) // Unblock user

	// Coordinates (protected)
	protected.Post("/coordinates", coordinateHandler.CreateCoordinate)
	protected.Get("/coordinates", coordinateHandler.ListCoordinates)
	protected.Get("/coordinates/:id", coordinateHandler.GetCoordinate)
	protected.Put("/coordinates/:id", coordinateHandler.UpdateCoordinate)
	protected.Delete("/coordinates/:id", coordinateHandler.DeleteCoordinate)

	// Satellite data (protected)
	protected.Post("/coordinates/:id/analyze", satelliteHandler.GenerateAnalysis)
	protected.Get("/coordinates/:id/satellite", satelliteHandler.GetAnalysisForCoordinate)
	protected.Get("/alerts", satelliteHandler.GetLatestAlerts)

	// History (protected)
	protected.Get("/history", historyHandler.GetHistory)

	// Export (protected, premium only)
	protected.Get("/export/csv", exportHandler.ExportCSV)

	// Admin moderation panel (protected + admin role check)
	admin := api.Group("/admin", middleware.JWTProtected(cfg), middleware.AdminRequired(db))
	admin.Get("/moderation/reports", moderationHandler.ListReports)
	admin.Put("/moderation/reports/:id", moderationHandler.ActionReport)

	// Webhooks (verified by auth header, not JWT)
	webhooks := api.Group("/webhooks")
	webhooks.Post("/revenuecat", webhookHandler.HandleRevenueCat)
}
