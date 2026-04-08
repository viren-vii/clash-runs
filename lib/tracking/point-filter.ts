import type { RoutePoint } from '../types';

const MAX_ACCURACY_METERS = 30;
const MAX_SPEED_MPS = 50; // 180 km/h
const MIN_DISTANCE_METERS = 1;
const MAX_ACCELERATION_MPS2 = 15; // ~1.5g

/**
 * Filters out GPS jitter and erroneous points.
 * Returns true if the point should be kept.
 */
export function isValidPoint(
  point: RoutePoint,
  previousPoint: RoutePoint | null,
): boolean {
  // Filter by accuracy
  if (point.accuracy !== null && point.accuracy > MAX_ACCURACY_METERS) {
    return false;
  }

  // Filter by speed
  if (point.speed !== null && point.speed > MAX_SPEED_MPS) {
    return false;
  }

  if (previousPoint) {
    const timeDelta = (point.timestamp - previousPoint.timestamp) / 1000; // seconds
    if (timeDelta <= 0) return false;

    // Check for impossible acceleration
    if (
      point.speed !== null &&
      previousPoint.speed !== null &&
      timeDelta > 0
    ) {
      const acceleration = Math.abs(point.speed - previousPoint.speed) / timeDelta;
      if (acceleration > MAX_ACCELERATION_MPS2) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Simple moving average smoothing for a series of route points.
 * Smooths latitude/longitude using a window of the given size.
 */
export function smoothRoutePoints(
  points: RoutePoint[],
  windowSize: number = 3,
): RoutePoint[] {
  if (points.length <= windowSize) return points;

  const half = Math.floor(windowSize / 2);
  return points.map((point, i) => {
    // Don't smooth across segment boundaries
    const start = Math.max(0, i - half);
    const end = Math.min(points.length - 1, i + half);

    let sumLat = 0;
    let sumLng = 0;
    let count = 0;

    for (let j = start; j <= end; j++) {
      if (points[j].segmentIndex !== point.segmentIndex) continue;
      sumLat += points[j].latitude;
      sumLng += points[j].longitude;
      count++;
    }

    if (count === 0) return point;

    return {
      ...point,
      latitude: sumLat / count,
      longitude: sumLng / count,
    };
  });
}
