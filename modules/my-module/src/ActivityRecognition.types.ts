export type DetectedActivityType =
  | 'stationary'
  | 'walking'
  | 'running'
  | 'cycling'
  | 'automotive'
  | 'unknown';

export type ActivityConfidence = 'low' | 'medium' | 'high';

export interface ActivityChangeEvent {
  type: DetectedActivityType;
  confidence: ActivityConfidence;
  timestamp: number;
}

export type ActivityRecognitionModuleEvents = {
  onActivityChange: (event: ActivityChangeEvent) => void;
};
