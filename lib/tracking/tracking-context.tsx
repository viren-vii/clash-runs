import React, { createContext, useContext, useEffect, useState } from 'react';
import { sessionManager } from './session-manager';
import type {
  TrackingState,
  SessionActivityType,
  SessionSummary,
} from '../types';

const initialState: TrackingState = {
  isTracking: false,
  sessionId: null,
  status: 'idle',
  elapsedTime: 0,
  totalDistance: 0,
  currentPace: null,
  currentSpeed: null,
  currentActivity: 'unknown',
  segmentIndex: 0,
  currentLocation: null,
  routePoints: [],
};

interface TrackingContextValue {
  state: TrackingState;
  startSession: (activityType?: SessionActivityType, userWeight?: number) => Promise<string>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<SessionSummary>;
  discardSession: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TrackingState>(initialState);

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const value: TrackingContextValue = {
    state,
    startSession: (activityType, userWeight) => sessionManager.startSession(activityType, userWeight),
    pauseSession: () => sessionManager.pauseSession(),
    resumeSession: () => sessionManager.resumeSession(),
    stopSession: () => sessionManager.stopSession(),
    discardSession: () => sessionManager.discardSession(),
  };

  return (
    <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}
