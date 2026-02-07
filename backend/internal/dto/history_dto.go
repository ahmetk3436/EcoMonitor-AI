package dto

import "github.com/google/uuid"

type HistoryResponse struct {
	ID              uuid.UUID `json:"id"`
	CoordinateLabel string    `json:"coordinate_label"`
	AnalysisType    string    `json:"analysis_type"`
	ResultSummary   string    `json:"result_summary"`
	ConfidenceAvg   float64   `json:"confidence_avg"`
	ChangeCount     int       `json:"change_count"`
	CreatedAt       string    `json:"created_at"`
}

type PaginatedHistoryResponse struct {
	Data       []HistoryResponse `json:"data"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalCount int64             `json:"total_count"`
	TotalPages int               `json:"total_pages"`
}
