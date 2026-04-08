import * as TaskManager from 'expo-task-manager';
import { insertRoutePoint } from '../database/route-repository';

export const LOCATION_TASK_NAME = 'CLASH_RUNS_LOCATION_TASK';

/**
 * Shared state accessible by the background task.
 * Updated by the location service when tracking starts/stops.
 */
export const taskState = {
  sessionId: null as string | null,
  segmentIndex: 0,
};

/**
 * Background location task definition.
 * This MUST be called at module scope (top-level import in _layout.tsx)
 * so that TaskManager can find it when the app is backgrounded.
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[LocationTask] Error:', error.message);
    return;
  }

  if (!data || !taskState.sessionId) return;

  const { locations } = data as {
    locations: Array<{
      coords: {
        latitude: number;
        longitude: number;
        altitude: number | null;
        accuracy: number | null;
        speed: number | null;
      };
      timestamp: number;
    }>;
  };

  for (const location of locations) {
    // Filter out inaccurate GPS readings
    if (location.coords.accuracy && location.coords.accuracy > 30) continue;
    // Filter out impossible speeds (>50 m/s = 180 km/h)
    if (location.coords.speed && location.coords.speed > 50) continue;

    try {
      await insertRoutePoint(taskState.sessionId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        timestamp: location.timestamp,
        segmentIndex: taskState.segmentIndex,
      });
    } catch (e) {
      console.error('[LocationTask] Failed to insert route point:', e);
    }
  }
});
