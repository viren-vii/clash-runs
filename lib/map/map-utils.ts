import type { RoutePoint, SegmentActivityType } from '../types';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface SegmentedPolyline {
  coordinates: LatLng[];
  color: string;
  segmentIndex: number;
  activityType: SegmentActivityType;
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

/** Split route into colored polyline segments by segment index. */
export function segmentPolylines(
  routePoints: RoutePoint[],
  activityTypeBySegment?: Map<number, SegmentActivityType>,
): SegmentedPolyline[] {
  if (routePoints.length === 0) return [];

  const segments: SegmentedPolyline[] = [];
  let currentSegmentIndex = routePoints[0].segmentIndex;
  let currentCoords: LatLng[] = [];

  for (const point of routePoints) {
    if (point.segmentIndex !== currentSegmentIndex) {
      // Close previous segment
      const actType =
        activityTypeBySegment?.get(currentSegmentIndex) ?? 'unknown';
      segments.push({
        coordinates: currentCoords,
        color: ACTIVITY_COLORS[actType],
        segmentIndex: currentSegmentIndex,
        activityType: actType,
      });

      // Start new segment — include last point of previous for continuity
      currentCoords = currentCoords.length > 0
        ? [currentCoords[currentCoords.length - 1]]
        : [];
      currentSegmentIndex = point.segmentIndex;
    }

    currentCoords.push({
      latitude: point.latitude,
      longitude: point.longitude,
    });
  }

  // Close last segment
  if (currentCoords.length > 0) {
    const actType =
      activityTypeBySegment?.get(currentSegmentIndex) ?? 'unknown';
    segments.push({
      coordinates: currentCoords,
      color: ACTIVITY_COLORS[actType],
      segmentIndex: currentSegmentIndex,
      activityType: actType,
    });
  }

  return segments;
}
