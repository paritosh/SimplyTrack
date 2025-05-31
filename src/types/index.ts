
export interface Tracker {
  id: string;
  name: string;
  unit: string; // e.g., "bpm", "%", "$", "kg", "count", or "occurrence" for event type
  createdAt: string; // ISO date string
  color?: string; // HSL string or CSS variable string like "hsl(var(--primary))"
  isPinned?: boolean;
  type?: 'value' | 'event'; // 'value' for numerical data, 'event' for occurrences
}

export interface DataPoint {
  id:string;
  trackerId: string;
  value: number; // For event trackers, this might be a nominal 1
  timestamp: string; // ISO date string
  notes?: string;
}
