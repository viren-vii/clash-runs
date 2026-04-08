import { Platform } from 'react-native';
import type { RoutePoint } from '../types';

export interface HealthWorkout {
  startTime: number;
  endTime: number;
  distance: number; // meters
  activityType: string;
}

export interface HealthService {
  initialize(): Promise<boolean>;
  querySteps(startTime: Date, endTime: Date): Promise<number>;
  queryDistance(startTime: Date, endTime: Date): Promise<number>;
  queryWorkouts(startTime: Date, endTime: Date): Promise<HealthWorkout[]>;
}

let healthService: HealthService | null = null;

export async function getHealthService(): Promise<HealthService | null> {
  if (healthService) return healthService;

  try {
    if (Platform.OS === 'ios') {
      const module = await import('./healthkit-adapter.ios');
      healthService = module.healthKitService;
    } else if (Platform.OS === 'android') {
      const module = await import('./health-connect-adapter.android');
      healthService = module.healthConnectService;
    }
  } catch (e) {
    console.warn('[HealthService] Failed to load health adapter:', e);
  }

  return healthService;
}
