import { getDatabase } from './database';
import type { RoutePoint } from '../types';

function rowToRoutePoint(row: Record<string, unknown>): RoutePoint {
  return {
    id: row.id as number,
    sessionId: row.session_id as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    altitude: (row.altitude as number) ?? null,
    accuracy: (row.accuracy as number) ?? null,
    speed: (row.speed as number) ?? null,
    timestamp: row.timestamp as number,
    segmentIndex: row.segment_index as number,
  };
}

export async function insertRoutePoint(
  sessionId: string,
  point: Omit<RoutePoint, 'id' | 'sessionId'>,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO route_points (session_id, latitude, longitude, altitude, accuracy, speed, timestamp, segment_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      point.latitude,
      point.longitude,
      point.altitude,
      point.accuracy,
      point.speed,
      point.timestamp,
      point.segmentIndex,
    ],
  );
}

export async function getRoutePoints(sessionId: string): Promise<RoutePoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM route_points WHERE session_id = ? ORDER BY timestamp ASC',
    [sessionId],
  );
  return rows.map(rowToRoutePoint);
}

