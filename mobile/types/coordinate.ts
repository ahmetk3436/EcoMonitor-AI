export interface Coordinate {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoordinateDto {
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
}
