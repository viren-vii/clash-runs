import { ApiError } from '@viren-vii/api';
import { getApiClient } from './client';
import { clearAuth } from './auth';
import { getSession } from '../database/sessions-repository';
import { getRoutePoints } from '../database/route-repository';
import { getSegments } from '../database/segments-repository';
import {
  sessionToDto,
  routePointToDto,
  segmentToDto,
  chunk,
} from './mappers';

async function withAuthRetry<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await clearAuth();
      throw err;
    }
    throw err;
  }
}

const ROUTE_POINTS_BATCH = 500;
const SEGMENTS_BATCH = 500;

export interface SyncResult {
  sessionId: string;
  routePointsSent: number;
  segmentsSent: number;
}

export async function syncSession(sessionId: string): Promise<SyncResult> {
  const session = await getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const api = getApiClient();

  await withAuthRetry(() =>
    api.sessions.sync({ sessions: [sessionToDto(session)] }),
  );

  const [points, segments] = await Promise.all([
    getRoutePoints(sessionId),
    getSegments(sessionId),
  ]);

  let routePointsSent = 0;
  for (const batch of chunk(points, ROUTE_POINTS_BATCH)) {
    await withAuthRetry(() =>
      api.routePoints.post(
        { id: sessionId },
        { points: batch.map(routePointToDto) },
      ),
    );
    routePointsSent += batch.length;
  }

  let segmentsSent = 0;
  for (const batch of chunk(segments, SEGMENTS_BATCH)) {
    await withAuthRetry(() =>
      api.segments.post(
        { id: sessionId },
        { segments: batch.map(segmentToDto) },
      ),
    );
    segmentsSent += batch.length;
  }

  return { sessionId, routePointsSent, segmentsSent };
}
