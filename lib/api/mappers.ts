import type {
  SessionDto,
  RoutePointDto,
  SegmentDto,
} from '@viren-vii/api';
import type {
  Session,
  RoutePoint,
  ActivitySegment,
} from '../types';

export function sessionToDto(session: Session): SessionDto {
  return {
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    status: session.status,
    activityType: session.activityType,
    totalDistance: session.totalDistance,
    totalSteps: session.totalSteps,
    elapsedTime: session.elapsedTime,
    userWeight: session.userWeight,
    clientCreatedAt: session.createdAt,
    clientUpdatedAt: session.updatedAt,
  };
}

export function routePointToDto(point: RoutePoint): RoutePointDto {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    altitude: point.altitude,
    accuracy: point.accuracy,
    speed: point.speed,
    timestamp: point.timestamp,
    segmentIndex: point.segmentIndex,
  };
}

export function segmentToDto(segment: ActivitySegment): SegmentDto {
  return {
    segmentIndex: segment.segmentIndex,
    activityType: segment.activityType,
    confidence: segment.confidence,
    startTime: segment.startTime,
    endTime: segment.endTime,
    distance: segment.distance,
  };
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error('chunk size must be positive');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
