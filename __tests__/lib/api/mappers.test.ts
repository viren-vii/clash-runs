import {
  sessionToDto,
  routePointToDto,
  segmentToDto,
  chunk,
} from '../../../lib/api/mappers';
import type {
  Session,
  RoutePoint,
  ActivitySegment,
} from '../../../lib/types';

describe('api/mappers', () => {
  it('maps Session → SessionDto, renaming createdAt/updatedAt', () => {
    const session: Session = {
      id: 'sess-1',
      startTime: 100,
      endTime: 200,
      status: 'completed',
      totalDistance: 1234.5,
      totalSteps: 2000,
      elapsedTime: 100000,
      activityType: 'run',
      userWeight: 72,
      createdAt: 99,
      updatedAt: 201,
    };
    expect(sessionToDto(session)).toEqual({
      id: 'sess-1',
      startTime: 100,
      endTime: 200,
      status: 'completed',
      activityType: 'run',
      totalDistance: 1234.5,
      totalSteps: 2000,
      elapsedTime: 100000,
      userWeight: 72,
      clientCreatedAt: 99,
      clientUpdatedAt: 201,
    });
  });

  it('maps RoutePoint → RoutePointDto and drops sessionId/id', () => {
    const point: RoutePoint = {
      id: 42,
      sessionId: 'sess-1',
      latitude: 37.7,
      longitude: -122.4,
      altitude: 10,
      accuracy: 5,
      speed: 3.2,
      timestamp: 123,
      segmentIndex: 1,
    };
    const dto = routePointToDto(point);
    expect(dto).toEqual({
      latitude: 37.7,
      longitude: -122.4,
      altitude: 10,
      accuracy: 5,
      speed: 3.2,
      timestamp: 123,
      segmentIndex: 1,
    });
    expect(dto as Record<string, unknown>).not.toHaveProperty('sessionId');
  });

  it('maps ActivitySegment → SegmentDto', () => {
    const seg: ActivitySegment = {
      id: 7,
      sessionId: 'sess-1',
      segmentIndex: 2,
      activityType: 'running',
      confidence: 'high',
      startTime: 100,
      endTime: 200,
      distance: 500,
    };
    expect(segmentToDto(seg)).toEqual({
      segmentIndex: 2,
      activityType: 'running',
      confidence: 'high',
      startTime: 100,
      endTime: 200,
      distance: 500,
    });
  });

  describe('chunk', () => {
    it('splits into batches of the given size', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
    it('returns a single batch when items fit', () => {
      expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
    });
    it('returns empty array for empty input', () => {
      expect(chunk([], 5)).toEqual([]);
    });
    it('throws on non-positive size', () => {
      expect(() => chunk([1], 0)).toThrow();
    });
  });
});
