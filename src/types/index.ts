export interface Metric {
  id: string;
  name: string;
  unit: string; // e.g., "bpm", "%", "$", "kg", "count"
  createdAt: string; // ISO date string
  color?: string; // HSL string or CSS variable string like "hsl(var(--primary))"
  isPinned?: boolean;
}

export interface DataPoint {
  id: string;
  metricId: string;
  value: number;
  timestamp: string; // ISO date string
  notes?: string;
}
