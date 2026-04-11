import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LOCATION_TASK_NAME, taskState } from './task-definitions';
import { insertRoutePoint } from '../database/route-repository';
import { haversineDistance } from './distance-calculator';
import type { RoutePoint } from '../types';

type LocationCallback = (point: RoutePoint) => void;

let foregroundSubscription: Location.LocationSubscription | null = null;
let lastPoint: { latitude: number; longitude: number } | null = null;
let totalDistance = 0;
let onLocationUpdate: LocationCallback | null = null;
let lastSpeed: number | null = null; // m/s, from GPS
let lastMovementTime: number = 0; // ms timestamp of last >1m movement

export function setLocationCallback(callback: LocationCallback | null): void {
  onLocationUpdate = callback;
}

export function getTotalDistance(): number {
  return totalDistance;
}

export function getLastPoint(): { latitude: number; longitude: number } | null {
  return lastPoint;
}

export function getLastSpeed(): number | null {
  return lastSpeed;
}

export function getLastMovementTime(): number {
  return lastMovementTime;
}

export async function startTracking(
  sessionId: string,
  segmentIndex: number,
  initialDistance: number = 0,
): Promise<void> {
  taskState.sessionId = sessionId;
  taskState.segmentIndex = segmentIndex;
  totalDistance = initialDistance;
  lastPoint = null;
  lastSpeed = null;
  lastMovementTime = 0;

  // Start foreground location watching (high accuracy, real-time updates)
  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5, // meters
      timeInterval: 1000, // ms
    },
    async (location) => {
      // Filter inaccurate readings
      if (location.coords.accuracy && location.coords.accuracy > 30) return;
      if (location.coords.speed && location.coords.speed > 50) return;

      // Track current speed for stationary detection
      lastSpeed = location.coords.speed ?? null;

      const point: RoutePoint = {
        sessionId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude ?? null,
        accuracy: location.coords.accuracy ?? null,
        speed: location.coords.speed ?? null,
        timestamp: location.timestamp,
        segmentIndex: taskState.segmentIndex,
      };

      // Calculate incremental distance
      if (lastPoint) {
        const delta = haversineDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          point.latitude,
          point.longitude,
        );
        // Only add distance if it's a reasonable movement (> 1m to filter jitter)
        if (delta > 1) {
          totalDistance += delta;
          lastMovementTime = Date.now();
        }
      }
      lastPoint = { latitude: point.latitude, longitude: point.longitude };

      // Persist to database
      try {
        await insertRoutePoint(sessionId, point);
      } catch (e) {
        console.error('[LocationService] Failed to insert point:', e);
      }

      // Notify UI
      onLocationUpdate?.(point);
    },
  );

  // Start background location updates (for when app is backgrounded)
  const isBackgroundRegistered = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME,
  ).catch(() => false);

  if (!isBackgroundRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10, // slightly less frequent in background
      showsBackgroundLocationIndicator: true, // iOS blue bar
      foregroundService: {
        notificationTitle: 'Clash Runs',
        notificationBody: 'Tracking your activity...',
        notificationColor: '#4CAF50',
      },
    });
  }
}

export async function pauseTracking(): Promise<void> {
  // Stop foreground subscription
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }

  // Stop background updates
  const isRegistered = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME,
  ).catch(() => false);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

export async function resumeTracking(
  sessionId: string,
  segmentIndex: number,
): Promise<void> {
  // Reset last point so we don't calculate distance across the pause gap
  lastPoint = null;
  await startTracking(sessionId, segmentIndex, totalDistance);
}

export async function stopTracking(): Promise<number> {
  await pauseTracking();
  taskState.sessionId = null;
  taskState.segmentIndex = 0;
  onLocationUpdate = null;
  const finalDistance = totalDistance;
  totalDistance = 0;
  lastPoint = null;
  lastSpeed = null;
  lastMovementTime = 0;
  return finalDistance;
}
