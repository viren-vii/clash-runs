import { ApiError } from '@viren-vii/api';
import { syncSession } from '../../../lib/api/sync';
import * as sessionsRepo from '../../../lib/database/sessions-repository';
import * as routeRepo from '../../../lib/database/route-repository';
import * as segmentsRepo from '../../../lib/database/segments-repository';
import * as clientModule from '../../../lib/api/client';
import * as authModule from '../../../lib/api/auth';
import type {
  Session,
  RoutePoint,
  ActivitySegment,
} from '../../../lib/types';

function makeSession(): Session {
  return {
    id: 'sess-xyz',
    startTime: 100,
    endTime: 200,
    status: 'completed',
    totalDistance: 1000,
    totalSteps: 500,
    elapsedTime: 100,
    activityType: 'run',
    userWeight: 70,
    createdAt: 99,
    updatedAt: 201,
  };
}

function makePoints(n: number): RoutePoint[] {
  return Array.from({ length: n }, (_, i) => ({
    sessionId: 'sess-xyz',
    latitude: 37 + i * 0.0001,
    longitude: -122,
    altitude: null,
    accuracy: null,
    speed: null,
    timestamp: 1000 + i,
    segmentIndex: 0,
  }));
}

function makeSegments(n: number): ActivitySegment[] {
  return Array.from({ length: n }, (_, i) => ({
    sessionId: 'sess-xyz',
    segmentIndex: i,
    activityType: 'running' as const,
    confidence: 'high' as const,
    startTime: 1000 + i * 10,
    endTime: 1000 + i * 10 + 5,
    distance: 100,
  }));
}

describe('syncSession', () => {
  const sessionsSync = jest.fn().mockResolvedValue({ upserted: [], rejected: [] });
  const routePointsPost = jest.fn().mockResolvedValue({ inserted: 0, skipped: 0 });
  const segmentsPost = jest.fn().mockResolvedValue({ upserted: 0 });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(clientModule, 'getApiClient').mockReturnValue({
      auth: { registerDevice: jest.fn() },
      me: { get: jest.fn() },
      sessions: {
        sync: sessionsSync,
        list: jest.fn(),
        get: jest.fn(),
      },
      routePoints: { post: routePointsPost },
      segments: { post: segmentsPost },
      health: { get: jest.fn() },
    } as unknown as ReturnType<typeof clientModule.getApiClient>);
  });

  it('throws if session is missing', async () => {
    jest.spyOn(sessionsRepo, 'getSession').mockResolvedValue(null);
    await expect(syncSession('missing')).rejects.toThrow(/not found/);
  });

  it('sends session then points then segments, batching by 500', async () => {
    jest.spyOn(sessionsRepo, 'getSession').mockResolvedValue(makeSession());
    jest.spyOn(routeRepo, 'getRoutePoints').mockResolvedValue(makePoints(1200));
    jest.spyOn(segmentsRepo, 'getSegments').mockResolvedValue(makeSegments(3));

    const result = await syncSession('sess-xyz');

    expect(sessionsSync).toHaveBeenCalledTimes(1);
    expect(sessionsSync).toHaveBeenCalledWith({
      sessions: [expect.objectContaining({ id: 'sess-xyz', clientCreatedAt: 99 })],
    });

    // 1200 points → 500, 500, 200
    expect(routePointsPost).toHaveBeenCalledTimes(3);
    expect(routePointsPost.mock.calls[0][0]).toEqual({ id: 'sess-xyz' });
    expect(routePointsPost.mock.calls[0][1].points).toHaveLength(500);
    expect(routePointsPost.mock.calls[2][1].points).toHaveLength(200);

    expect(segmentsPost).toHaveBeenCalledTimes(1);
    expect(segmentsPost.mock.calls[0][1].segments).toHaveLength(3);

    expect(result).toEqual({
      sessionId: 'sess-xyz',
      routePointsSent: 1200,
      segmentsSent: 3,
    });
  });

  it('on 401 clears auth and retries the failing call once', async () => {
    jest.spyOn(sessionsRepo, 'getSession').mockResolvedValue(makeSession());
    jest.spyOn(routeRepo, 'getRoutePoints').mockResolvedValue([]);
    jest.spyOn(segmentsRepo, 'getSegments').mockResolvedValue([]);
    const clearAuth = jest
      .spyOn(authModule, 'clearAuth')
      .mockResolvedValue(undefined);

    sessionsSync
      .mockRejectedValueOnce(new ApiError(401, 'unauthorized'))
      .mockResolvedValueOnce({ upserted: ['sess-xyz'], rejected: [] });

    await expect(syncSession('sess-xyz')).resolves.toBeDefined();
    expect(sessionsSync).toHaveBeenCalledTimes(2);
    expect(clearAuth).toHaveBeenCalledTimes(1);
  });

  it('propagates non-401 errors without retry', async () => {
    jest.spyOn(sessionsRepo, 'getSession').mockResolvedValue(makeSession());
    jest.spyOn(routeRepo, 'getRoutePoints').mockResolvedValue([]);
    jest.spyOn(segmentsRepo, 'getSegments').mockResolvedValue([]);
    const clearAuth = jest
      .spyOn(authModule, 'clearAuth')
      .mockResolvedValue(undefined);

    sessionsSync.mockRejectedValueOnce(new ApiError(500, 'boom'));

    await expect(syncSession('sess-xyz')).rejects.toThrow(/500/);
    expect(sessionsSync).toHaveBeenCalledTimes(1);
    expect(clearAuth).not.toHaveBeenCalled();
  });

  it('does not retry twice on a second 401 (fails fast)', async () => {
    jest.spyOn(sessionsRepo, 'getSession').mockResolvedValue(makeSession());
    jest.spyOn(routeRepo, 'getRoutePoints').mockResolvedValue([]);
    jest.spyOn(segmentsRepo, 'getSegments').mockResolvedValue([]);
    jest.spyOn(authModule, 'clearAuth').mockResolvedValue(undefined);

    sessionsSync
      .mockRejectedValueOnce(new ApiError(401, 'unauthorized'))
      .mockRejectedValueOnce(new ApiError(401, 'still-unauthorized'));

    await expect(syncSession('sess-xyz')).rejects.toThrow(/401/);
    expect(sessionsSync).toHaveBeenCalledTimes(2);
  });

  it('skips point/segment calls when there are none', async () => {
    jest.spyOn(sessionsRepo, 'getSession').mockResolvedValue(makeSession());
    jest.spyOn(routeRepo, 'getRoutePoints').mockResolvedValue([]);
    jest.spyOn(segmentsRepo, 'getSegments').mockResolvedValue([]);

    const result = await syncSession('sess-xyz');

    expect(sessionsSync).toHaveBeenCalledTimes(1);
    expect(routePointsPost).not.toHaveBeenCalled();
    expect(segmentsPost).not.toHaveBeenCalled();
    expect(result.routePointsSent).toBe(0);
    expect(result.segmentsSent).toBe(0);
  });
});
