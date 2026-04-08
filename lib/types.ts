export type SessionStatus = 'active' | 'paused' | 'completed' | 'discarded';

export type SessionActivityType = 'run' | 'walk' | 'cycle' | 'mixed';

export type SegmentActivityType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'stationary'
  | 'unknown';

export type Confidence = 'low' | 'medium' | 'high';

export interface Session {
  id: string;
  startTime: number; // Unix ms
  endTime: number | null;
  status: SessionStatus;
  totalDistance: number; // meters
  totalSteps: number;
  elapsedTime: number; // ms excluding paused time
  activityType: SessionActivityType;
  userWeight: number; // kg at time of session
  createdAt: number;
  updatedAt: number;
}

export interface RoutePoint {
  id?: number;
  sessionId: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null; // m/s
  timestamp: number; // Unix ms
  segmentIndex: number;
}

export interface ActivitySegment {
  id?: number;
  sessionId: string;
  segmentIndex: number;
  activityType: SegmentActivityType;
  confidence: Confidence | null;
  startTime: number;
  endTime: number | null;
  distance: number; // meters
}

export interface TrackingState {
  isTracking: boolean;
  sessionId: string | null;
  status: SessionStatus | 'idle';
  elapsedTime: number;
  totalDistance: number;
  currentPace: number | null; // min/km
  currentSpeed: number | null; // m/s
  currentActivity: SegmentActivityType;
  segmentIndex: number;
  currentLocation: { latitude: number; longitude: number } | null;
  routePoints: RoutePoint[];
}

export interface SessionSummary {
  session: Session;
  routePoints: RoutePoint[];
  segments: ActivitySegment[];
  averagePace: number | null; // min/km
  averageSpeed: number | null; // m/s
}
