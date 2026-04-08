import {
  initialize as initHealthConnect,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { HealthService, HealthWorkout } from './health-service';

async function initialize(): Promise<boolean> {
  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      console.warn('[HealthConnect] SDK not available, status:', status);
      return false;
    }

    await initHealthConnect();

    await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'ExerciseSession' },
    ]);

    return true;
  } catch (e) {
    console.error('[HealthConnect] Init failed:', e);
    return false;
  }
}

async function querySteps(startTime: Date, endTime: Date): Promise<number> {
  try {
    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });

    return result.records.reduce(
      (sum, record) => sum + (record.count ?? 0),
      0,
    );
  } catch (e) {
    console.error('[HealthConnect] querySteps failed:', e);
    return 0;
  }
}

async function queryDistance(
  startTime: Date,
  endTime: Date,
): Promise<number> {
  try {
    const result = await readRecords('Distance', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });

    return result.records.reduce(
      (sum, record) => sum + ((record.distance as any)?.inMeters ?? 0),
      0,
    );
  } catch (e) {
    console.error('[HealthConnect] queryDistance failed:', e);
    return 0;
  }
}

async function queryWorkouts(
  startTime: Date,
  endTime: Date,
): Promise<HealthWorkout[]> {
  try {
    const result = await readRecords('ExerciseSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });

    return result.records.map((record) => ({
      startTime: new Date(record.startTime).getTime(),
      endTime: new Date(record.endTime).getTime(),
      distance: 0, // Health Connect doesn't directly include distance in exercise sessions
      activityType: mapExerciseType(record.exerciseType ?? 0),
    }));
  } catch (e) {
    console.error('[HealthConnect] queryWorkouts failed:', e);
    return [];
  }
}

function mapExerciseType(type: number): string {
  // Health Connect exercise type constants
  switch (type) {
    case 56: // RUNNING
    case 57: // RUNNING_TREADMILL
      return 'running';
    case 79: // WALKING
      return 'walking';
    case 8: // BIKING
    case 9: // BIKING_STATIONARY
      return 'cycling';
    default:
      return 'unknown';
  }
}

export const healthConnectService: HealthService = {
  initialize,
  querySteps,
  queryDistance,
  queryWorkouts,
};
