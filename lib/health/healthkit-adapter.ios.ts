import HealthKit from '@kingstinct/react-native-healthkit';
import type { HealthService, HealthWorkout } from './health-service';

async function initialize(): Promise<boolean> {
  try {
    const isAvailable = await HealthKit.isHealthDataAvailable();
    if (!isAvailable) return false;

    await HealthKit.requestAuthorization([
      'HKQuantityTypeIdentifierStepCount',
      'HKQuantityTypeIdentifierDistanceWalkingRunning',
      'HKQuantityTypeIdentifierDistanceCycling',
    ] as any);

    return true;
  } catch (e) {
    console.error('[HealthKit] Init failed:', e);
    return false;
  }
}

async function querySteps(startTime: Date, endTime: Date): Promise<number> {
  try {
    const result = await (HealthKit as any).queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierStepCount',
      [{ from: startTime, to: endTime }],
      { unit: 'count' },
    );
    return result?.sumQuantity?.quantity ?? 0;
  } catch (e) {
    console.error('[HealthKit] querySteps failed:', e);
    return 0;
  }
}

async function queryDistance(startTime: Date, endTime: Date): Promise<number> {
  try {
    const result = await (HealthKit as any).queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierDistanceWalkingRunning',
      [{ from: startTime, to: endTime }],
      { unit: 'm' },
    );
    return result?.sumQuantity?.quantity ?? 0;
  } catch (e) {
    console.error('[HealthKit] queryDistance failed:', e);
    return 0;
  }
}

async function queryWorkouts(
  startTime: Date,
  endTime: Date,
): Promise<HealthWorkout[]> {
  try {
    const workouts = await (HealthKit as any).queryWorkoutSamples({
      from: startTime,
      to: endTime,
    });

    return (workouts ?? []).map((w: any) => ({
      startTime: new Date(w.startDate).getTime(),
      endTime: new Date(w.endDate).getTime(),
      distance: w.totalDistance?.quantity ?? 0,
      activityType: mapWorkoutType(w.workoutActivityType),
    }));
  } catch (e) {
    console.error('[HealthKit] queryWorkouts failed:', e);
    return [];
  }
}

function mapWorkoutType(type: number): string {
  // HKWorkoutActivityType constants
  switch (type) {
    case 37: // running
      return 'running';
    case 52: // walking
      return 'walking';
    case 13: // cycling
      return 'cycling';
    default:
      return 'unknown';
  }
}

export const healthKitService: HealthService = {
  initialize,
  querySteps,
  queryDistance,
  queryWorkouts,
};
