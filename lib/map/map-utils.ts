import type { RoutePoint } from '../types';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const ACTIVITY_COLORS: Record<SegmentActivityType, string> = {
  running: '#4CAF50',
  walking: '#2196F3',
  cycling: '#FF9800',
  stationary: '#9E9E9E',
  unknown: '#4CAF50', // Default to running green
};

/** Calculate a map region that fits all points with padding. */
export function getRegionForCoordinates(
  points: LatLng[],
  padding: number = 1.5,
): Region {
  if (points.length === 0) {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  const latDelta = (maxLat - minLat) * padding || 0.005;
  const lngDelta = (maxLng - minLng) * padding || 0.005;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/** Convert DB route points to map LatLng array. */
export function coordinatesToPolyline(routePoints: RoutePoint[]): LatLng[] {
  return routePoints.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));
}
