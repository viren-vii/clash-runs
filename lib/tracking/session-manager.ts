import {
  createSession,
  getSession,
  updateSession,
  completeSession as completeSessionDb,
  getActiveSession,
} from '../database/sessions-repository';
import { getRoutePoints } from '../database/route-repository';
import { getSegments } from '../database/segments-repository';
import * as LocationService from './location-service';
import { TimerService } from './timer-service';
import {
  calculatePace,
  calculateSpeed,
  isStationary,
} from './distance-calculator';
import { syncSession } from '../api/sync';
import type {
  Session,
  SessionActivityType,
  SessionSummary,
  TrackingState,
  RoutePoint,
} from '../types';

type StateListener = (state: TrackingState) => void;

class SessionManager {
  private currentSessionId: string | null = null;
  private segmentIndex: number = 0;
  private timer: TimerService = new TimerService();
  private routePoints: RoutePoint[] = [];
  private listeners: Set<StateListener> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  getState(): TrackingState {
    const elapsedTime = this.timer.getElapsedTime();
    const totalDistance = LocationService.getTotalDistance();
    const lastPoint = LocationService.getLastPoint();
    const speed = LocationService.getLastSpeed();
    const lastMovementTime = LocationService.getLastMovementTime();
    const moving = !isStationary(speed, lastMovementTime);

    return {
      isTracking: this.currentSessionId !== null && this.timer.isRunning(),
      sessionId: this.currentSessionId,
      status: this.currentSessionId
        ? this.timer.isRunning()
          ? 'active'
          : 'paused'
        : 'idle',
      elapsedTime,
      totalDistance,
      currentPace: moving ? calculatePace(totalDistance, elapsedTime) : null,
      currentSpeed: moving ? calculateSpeed(totalDistance, elapsedTime) : null,
      currentActivity: 'unknown',
      segmentIndex: this.segmentIndex,
      currentLocation: lastPoint,
      routePoints: this.routePoints,
    };
  }

  async startSession(
    activityType: SessionActivityType = 'run',
    userWeight: number = 70,
  ): Promise<string> {
    // Check for existing active session
    if (this.currentSessionId) {
      throw new Error('A session is already active');
    }

    const session = await createSession(activityType, userWeight);
    this.currentSessionId = session.id;
    this.segmentIndex = 0;
    this.routePoints = [];

    // Set up location callback to collect route points for live UI
    LocationService.setLocationCallback((point: RoutePoint) => {
      this.routePoints.push(point);
      this.emit();
    });

    // Start tracking
    this.timer.start();
    await LocationService.startTracking(session.id, this.segmentIndex);

    // Start polling for UI updates (timer tick)
    this.startPolling();
    this.emit();

    return session.id;
  }

  async pauseSession(): Promise<void> {
    if (!this.currentSessionId) throw new Error('No active session');

    this.timer.pause();
    await LocationService.pauseTracking();

    // Persist elapsed time
    await updateSession(this.currentSessionId, {
      elapsedTime: this.timer.getElapsedTime(),
      totalDistance: LocationService.getTotalDistance(),
    });

    this.stopPolling();
    this.emit();
  }

  async resumeSession(): Promise<void> {
    if (!this.currentSessionId) throw new Error('No active session');

    this.segmentIndex++;
    this.timer.resume();
    await LocationService.resumeTracking(
      this.currentSessionId,
      this.segmentIndex,
    );

    await updateSession(this.currentSessionId, { status: 'active' });

    this.startPolling();
    this.emit();
  }

  async stopSession(): Promise<SessionSummary> {
    if (!this.currentSessionId) throw new Error('No active session');

    const sessionId = this.currentSessionId;

    // Stop tracking
    const finalDistance = await LocationService.stopTracking();
    const finalElapsed = this.timer.stop();

    // Update and complete session in DB
    await updateSession(sessionId, {
      totalDistance: finalDistance,
      elapsedTime: finalElapsed,
    });
    await completeSessionDb(sessionId);

    // Auto-sync to server in the background. Failures are non-fatal —
    // the session lives in SQLite and can be retried later.
    syncSession(sessionId).catch((err) => {
      console.warn('[sync] failed for session', sessionId, err);
    });

    // Fetch final data
    const session = await getSession(sessionId);
    const routePoints = await getRoutePoints(sessionId);
    const segments = await getSegments(sessionId);

    // Clean up — fully reset all state for next session
    this.currentSessionId = null;
    this.segmentIndex = 0;
    this.routePoints = [];
    this.timer.reset();
    this.stopPolling();
    this.emit();

    return {
      session: session!,
      routePoints,
      segments,
      averagePace: calculatePace(finalDistance, finalElapsed),
      averageSpeed: calculateSpeed(finalDistance, finalElapsed),
    };
  }

  async discardSession(): Promise<void> {
    if (!this.currentSessionId) throw new Error('No active session');

    await LocationService.stopTracking();
    this.timer.stop();

    await updateSession(this.currentSessionId, { status: 'discarded' });

    // Fully reset all state
    this.currentSessionId = null;
    this.segmentIndex = 0;
    this.routePoints = [];
    this.timer.reset();
    this.stopPolling();
    this.emit();
  }

  /** Recover an orphaned session (app was killed mid-tracking). */
  async recoverSession(): Promise<Session | null> {
    const activeSession = await getActiveSession();
    if (!activeSession) return null;

    this.currentSessionId = activeSession.id;
    this.routePoints = await getRoutePoints(activeSession.id);

    // Restore timer with accumulated time (but don't resume — let user decide)
    this.timer.restore(activeSession.elapsedTime, false);

    this.emit();
    return activeSession;
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => this.emit(), 1000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

// Singleton
export const sessionManager = new SessionManager();
