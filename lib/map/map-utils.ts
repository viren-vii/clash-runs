import type { Region, MapStyleElement } from 'react-native-maps';

import { ActivityColors } from '@/constants/theme';
import type { RoutePoint, SegmentActivityType } from '../types';

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Segment-activity → polyline color. Wired to the design-system `ActivityColors`
 * so a cycling segment on the map is the same Performance Purple as the
 * cycling chip on the session card.
 */
export const ACTIVITY_MAP_COLORS: Record<SegmentActivityType, string> = {
  running: ActivityColors.running,
  walking: ActivityColors.walking,
  cycling: ActivityColors.cycling,
  stationary: ActivityColors.stationary,
  unknown: ActivityColors.running, // default to the "run" Cyber Blue
};

// Back-compat alias: some older imports still reference ACTIVITY_COLORS.
export const ACTIVITY_COLORS = ACTIVITY_MAP_COLORS;

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

/**
 * Google Maps dark-mode styling. Desaturated instrument-panel feel that
 * matches the Kinetic Lab dark surfaces. Only consumed on Android; iOS uses
 * Apple Maps' native dark style automatically.
 */
export const DARK_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#141719' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141719' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9aa3a9' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6d767c' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1b2720' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2a2f33' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9aa3a9' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3a4048' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a1622' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515a60' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1f2326' }],
  },
] as const;
