export interface Metric {
  id: string;
  name: string;
  unit: string; // e.g., "bpm", "%", "$", "kg", "count"
  createdAt: string; // ISO date string
}

export interface DataPoint {
  id: string;
  metricId: string;
  value: number;
  timestamp: string; // ISO date string
  notes?: string;
}
