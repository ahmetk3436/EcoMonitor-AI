export type ChangeType =
  | 'construction'
  | 'vegetation_loss'
  | 'water_change'
  | 'urban_expansion';

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
}

export interface AnalyzeResponse {
  success: boolean;
  message: string;
}
