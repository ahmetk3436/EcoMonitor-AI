export type ChangeType =
  | 'construction'
  | 'vegetation_loss'
  | 'water_change'
  | 'urban_expansion'
  | 'deforestation'
  | 'pollution'
  | 'flooding'
  | 'erosion'
  | 'wildfire_risk'
  | 'biodiversity_loss';

export type SeverityType = 'low' | 'medium' | 'high' | 'critical';

export interface SatelliteAlert {
  id: string;
  coordinateId: string;
  changeType: ChangeType;
  confidence: number;
  coordinates: {
    lat: number;
    lng: number;
    label: string;
  };
  detectedAt: string;
  summary: string;
  severity: SeverityType;
  description?: string;
  aiModel?: string;
}

export interface SatelliteData {
  id: string;
  coordinateId: string;
  imageUrl: string;
  changeType: ChangeType;
  confidence: number;
  detectedAt: string;
  summary: string;
  severity: SeverityType;
  aiModel?: string;
  description?: string;
  createdAt: string;
}

export interface SatelliteAnalysisRequest {
  image_url: string;
  location: string;
  coordinates: string;
  ai_model?: string;
  priority?: string;
}

export interface SatelliteAnalysisResponse {
  id: string;
  change_type: ChangeType;
  summary: string;
  confidence: number;
  severity: SeverityType;
  ai_model: string;
  description: string;
  detected_at: string;
}

export interface AnalyzeResponse {
  success: boolean;
  message: string;
}

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  construction: 'Construction Detected',
  vegetation_loss: 'Vegetation Loss',
  water_change: 'Water Level Change',
  urban_expansion: 'Urban Expansion',
  deforestation: 'Deforestation',
  pollution: 'Pollution Detected',
  flooding: 'Flooding',
  erosion: 'Soil Erosion',
  wildfire_risk: 'Wildfire Risk',
  biodiversity_loss: 'Biodiversity Loss',
};

export const CHANGE_TYPE_ICONS: Record<ChangeType, string> = {
  construction: 'building',
  vegetation_loss: 'leaf',
  water_change: 'water',
  urban_expansion: 'business',
  deforestation: 'tree',
  pollution: 'cloud',
  flooding: 'rainy',
  erosion: 'layers',
  wildfire_risk: 'flame',
  biodiversity_loss: 'paw',
};

export const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  construction: '#F59E0B',
  vegetation_loss: '#22C55E',
  water_change: '#3B82F6',
  urban_expansion: '#8B5CF6',
  deforestation: '#059669',
  pollution: '#6B7280',
  flooding: '#0EA5E9',
  erosion: '#D97706',
  wildfire_risk: '#EF4444',
  biodiversity_loss: '#EC4899',
};

export const SEVERITY_LABELS: Record<SeverityType, string> = {
  low: 'Low Impact',
  medium: 'Medium Impact',
  high: 'High Impact',
  critical: 'Critical',
};

export const SEVERITY_COLORS: Record<SeverityType, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

export const SEVERITY_ICONS: Record<SeverityType, string> = {
  low: 'checkmark-circle',
  medium: 'alert-circle',
  high: 'warning',
  critical: 'alert',
};
