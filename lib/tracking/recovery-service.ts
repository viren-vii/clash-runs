import { getActiveSession, updateSession } from '../database/sessions-repository';
import { getLastRoutePoint } from '../database/route-repository';
import { getHealthService } from '../health/health-service';
import type { Session } from '../types';

export interface RecoveryResult {
  session: Session;
  gapStartTime: number;
  gapEndTime: number;
  recoveredDistance: number;
  recoveredSteps: number;
  hasHealthData: boolean;
}

/**
 * Checks for an orphaned active session and attempts to recover data
 * from the OS health store for the time gap.
 */
export async function checkAndRecoverSession(): Promise<RecoveryResult | null> {
  const activeSession = await getActiveSession();
  if (!activeSession) return null;

  const lastPoint = await getLastRoutePoint(activeSession.id);

  // The gap starts from the last recorded point (or session start if no points)
  const gapStart = lastPoint?.timestamp ?? activeSession.startTime;
  const gapEnd = Date.now();

  // Only attempt recovery if there's a meaningful gap (> 30 seconds)
  if (gapEnd - gapStart < 30000) {
    return {
      session: activeSession,
      gapStartTime: gapStart,
      gapEndTime: gapEnd,
      recoveredDistance: 0,
      recoveredSteps: 0,
      hasHealthData: false,
    };
  }

  let recoveredDistance = 0;
  let recoveredSteps = 0;
  let hasHealthData = false;

  try {
    const healthService = await getHealthService();
    if (healthService) {
      const initialized = await healthService.initialize();
      if (initialized) {
        const startDate = new Date(gapStart);
        const endDate = new Date(gapEnd);

        const [steps, distance] = await Promise.all([
          healthService.querySteps(startDate, endDate),
          healthService.queryDistance(startDate, endDate),
        ]);

        recoveredSteps = steps;
        recoveredDistance = distance;
        hasHealthData = steps > 0 || distance > 0;

        // Update session with recovered data
        if (hasHealthData) {
          await updateSession(activeSession.id, {
            totalDistance: activeSession.totalDistance + recoveredDistance,
            totalSteps: activeSession.totalSteps + recoveredSteps,
          });
        }
      }
    }
  } catch (e) {
    console.warn('[RecoveryService] Health data recovery failed:', e);
  }

  return {
    session: activeSession,
    gapStartTime: gapStart,
    gapEndTime: gapEnd,
    recoveredDistance,
    recoveredSteps,
    hasHealthData,
  };
}
