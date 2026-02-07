export interface AnalysisHistory {
  id: string;
  coordinate_label: string;
  analysis_type: string;
  result_summary: string;
  confidence_avg: number;
  change_count: number;
  created_at: string;
}

export interface PaginatedHistory {
  data: AnalysisHistory[];
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}
