import type { RoutePoint } from '../types';
import type { UnitSystem } from '../settings/settings-context';

const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_MILE = 1609.344;
const FEET_PER_METER = 3.28084;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine formula to calculate distance between two coordinates.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function calculateTotalDistance(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    // Don't calculate distance across segment boundaries
    if (points[i].segmentIndex !== points[i - 1].segmentIndex) continue;
    total += haversineDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude,
    );
  }
  return total;
}

// Below this speed (m/s) the device is considered stationary (~1 km/h)
const STATIONARY_SPEED_THRESHOLD = 0.3;
// If no >1m movement for this long, treat as stationary (fallback when GPS speed is unavailable)
const STATIONARY_TIMEOUT_MS = 5000;

/**
 * Returns true when the device appears to not be moving.
 * Uses GPS-reported speed when available; falls back to time since last
 * meaningful position change when speed is null.
 */
export function isStationary(
  speedMs: number | null,
  lastMovementTime: number,
): boolean {
  if (speedMs !== null) {
    return speedMs < STATIONARY_SPEED_THRESHOLD;
  }
  if (lastMovementTime === 0) return true; // no movement recorded yet
  return Date.now() - lastMovementTime > STATIONARY_TIMEOUT_MS;
}

/** Returns pace in minutes per kilometer, or null if no distance. */
export function calculatePace(
  distanceMeters: number,
  elapsedMs: number,
): number | null {
  if (distanceMeters <= 0 || elapsedMs <= 0) return null;
  const minutes = elapsedMs / 60000;
  const km = distanceMeters / 1000;
  return minutes / km;
}

/** Returns speed in m/s, or null if no time elapsed. */
export function calculateSpeed(
  distanceMeters: number,
  elapsedMs: number,
): number | null {
  if (elapsedMs <= 0) return null;
  return distanceMeters / (elapsedMs / 1000);
}

/** Format pace as "MM:SS" string. Unit-aware: /km or /mi. */
export function formatPace(
  paceMinPerKm: number | null,
  units: UnitSystem = 'metric',
): string {
  if (paceMinPerKm === null || !isFinite(paceMinPerKm)) return '--:--';
  // Convert min/km to min/mi if imperial: min/mi = min/km * km/mi = min/km * 1.60934
  const effectivePace =
    units === 'imperial' ? paceMinPerKm * (METERS_PER_MILE / 1000) : paceMinPerKm;
  const minutes = Math.floor(effectivePace);
  const seconds = Math.round((effectivePace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Get the pace unit label. */
export function getPaceUnit(units: UnitSystem = 'metric'): string {
  return units === 'imperial' ? '/mi' : '/km';
}

/** Format distance in meters to a human readable string. */
export function formatDistance(
  meters: number,
  units: UnitSystem = 'metric',
): string {
  if (units === 'imperial') {
    const miles = meters / METERS_PER_MILE;
    if (miles < 0.1) {
      return `${Math.round(meters * FEET_PER_METER)} ft`;
    }
    return `${miles.toFixed(2)} mi`;
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/** Get the distance unit label. */
export function getDistanceUnit(units: UnitSystem = 'metric'): string {
  return units === 'imperial' ? 'mi' : 'km';
}

/** Format elapsed time in ms to HH:MM:SS. */
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
