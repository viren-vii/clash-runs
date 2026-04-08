import {
  haversineDistance,
  calculateTotalDistance,
  isStationary,
  calculatePace,
  calculateSpeed,
  formatPace,
  formatDistance,
  formatElapsedTime,
  getPaceUnit,
  getDistanceUnit,
} from '@/lib/tracking/distance-calculator';
import type { RoutePoint } from '@/lib/types';

// Helper to create a minimal RoutePoint
function makePoint(
  overrides: Partial<RoutePoint> & { latitude: number; longitude: number },
): RoutePoint {
  return {
    sessionId: 'test',
    altitude: null,
    accuracy: null,
    speed: null,
    timestamp: Date.now(),
    segmentIndex: 0,
    ...overrides,
  };
}

// ── haversineDistance ──────────────────────────────────────────

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0);
  });

  it('calculates a known short distance (~111 km for 1 degree latitude)', () => {
    const dist = haversineDistance(0, 0, 1, 0);
    expect(dist).toBeCloseTo(111_195, -3); // ~111 km, within 1 km
  });

  it('calculates NYC to LA (~3,944 km)', () => {
    const dist = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(dist / 1000).toBeCloseTo(3944, -2); // within 100 km
  });

  it('handles negative coordinates', () => {
    const dist = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(dist).toBeGreaterThan(0);
  });
});

// ── calculateTotalDistance ─────────────────────────────────────

describe('calculateTotalDistance', () => {
  it('returns 0 for empty array', () => {
    expect(calculateTotalDistance([])).toBe(0);
  });

  it('returns 0 for single point', () => {
    expect(
      calculateTotalDistance([makePoint({ latitude: 0, longitude: 0 })]),
    ).toBe(0);
  });

  it('calculates distance for two points', () => {
    const points = [
      makePoint({ latitude: 0, longitude: 0 }),
      makePoint({ latitude: 0, longitude: 0.001 }),
    ];
    expect(calculateTotalDistance(points)).toBeGreaterThan(0);
  });

  it('skips distance across segment boundaries', () => {
    const points = [
      makePoint({ latitude: 0, longitude: 0, segmentIndex: 0 }),
      makePoint({ latitude: 0, longitude: 0.01, segmentIndex: 1 }),
    ];
    expect(calculateTotalDistance(points)).toBe(0);
  });

  it('sums distance within segments only', () => {
    const points = [
      makePoint({ latitude: 0, longitude: 0, segmentIndex: 0 }),
      makePoint({ latitude: 0, longitude: 0.001, segmentIndex: 0 }),
      makePoint({ latitude: 1, longitude: 1, segmentIndex: 1 }),
      makePoint({ latitude: 1, longitude: 1.001, segmentIndex: 1 }),
    ];
    const total = calculateTotalDistance(points);
    // Should be ~2x the distance of one 0.001-degree gap, not include the cross-segment jump
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(250); // two short gaps (~111m each), not the huge cross-segment one
  });
});

// ── isStationary ──────────────────────────────────────────────

describe('isStationary', () => {
  it('returns true when speed is below threshold', () => {
    expect(isStationary(0.1, Date.now())).toBe(true);
  });

  it('returns false when speed is above threshold', () => {
    expect(isStationary(0.5, Date.now())).toBe(false);
  });

  it('returns true when speed is exactly 0', () => {
    expect(isStationary(0, Date.now())).toBe(true);
  });

  it('returns true when speed is null and lastMovementTime is 0', () => {
    expect(isStationary(null, 0)).toBe(true);
  });

  it('returns true when speed is null and last movement was >5s ago', () => {
    expect(isStationary(null, Date.now() - 6000)).toBe(true);
  });

  it('returns false when speed is null and last movement was recent', () => {
    expect(isStationary(null, Date.now() - 1000)).toBe(false);
  });
});

// ── calculatePace ─────────────────────────────────────────────

describe('calculatePace', () => {
  it('returns null for zero distance', () => {
    expect(calculatePace(0, 60000)).toBeNull();
  });

  it('returns null for zero elapsed time', () => {
    expect(calculatePace(1000, 0)).toBeNull();
  });

  it('returns null for negative distance', () => {
    expect(calculatePace(-100, 60000)).toBeNull();
  });

  it('returns null for negative time', () => {
    expect(calculatePace(1000, -1000)).toBeNull();
  });

  it('calculates 10km in 60min as 6 min/km', () => {
    expect(calculatePace(10000, 3600000)).toBeCloseTo(6, 1);
  });

  it('calculates 5km in 25min as 5 min/km', () => {
    expect(calculatePace(5000, 1500000)).toBeCloseTo(5, 1);
  });
});

// ── calculateSpeed ────────────────────────────────────────────

describe('calculateSpeed', () => {
  it('returns null for zero elapsed time', () => {
    expect(calculateSpeed(1000, 0)).toBeNull();
  });

  it('returns 0 for zero distance', () => {
    expect(calculateSpeed(0, 60000)).toBe(0);
  });

  it('calculates 1000m in 100s as 10 m/s', () => {
    expect(calculateSpeed(1000, 100000)).toBeCloseTo(10);
  });
});

// ── formatPace ────────────────────────────────────────────────

describe('formatPace', () => {
  it('formats null as --:--', () => {
    expect(formatPace(null, 'metric')).toBe('--:--');
  });

  it('formats Infinity as --:--', () => {
    expect(formatPace(Infinity, 'metric')).toBe('--:--');
  });

  it('formats NaN as --:--', () => {
    expect(formatPace(NaN, 'metric')).toBe('--:--');
  });

  it('formats 6.0 min/km metric as 6:00', () => {
    expect(formatPace(6.0, 'metric')).toBe('6:00');
  });

  it('formats 5.5 min/km metric as 5:30', () => {
    expect(formatPace(5.5, 'metric')).toBe('5:30');
  });

  it('converts to imperial (min/mi)', () => {
    const imperial = formatPace(6.0, 'imperial');
    // 6 min/km * 1.609 ≈ 9.65 min/mi → 9:39
    expect(imperial).toMatch(/^9:\d{2}$/);
  });
});

// ── formatDistance ─────────────────────────────────────────────

describe('formatDistance', () => {
  it('formats 0 meters', () => {
    expect(formatDistance(0)).toBe('0 m');
  });

  it('formats meters below 1km', () => {
    expect(formatDistance(500)).toBe('500 m');
  });

  it('formats kilometers', () => {
    expect(formatDistance(1500)).toBe('1.50 km');
  });

  it('formats imperial: small distance as feet', () => {
    expect(formatDistance(30, 'imperial')).toMatch(/ft$/);
  });

  it('formats imperial: larger distance as miles', () => {
    expect(formatDistance(5000, 'imperial')).toMatch(/mi$/);
  });
});

// ── formatElapsedTime ─────────────────────────────────────────

describe('formatElapsedTime', () => {
  it('formats 0ms', () => {
    expect(formatElapsedTime(0)).toBe('0:00');
  });

  it('formats 30 seconds', () => {
    expect(formatElapsedTime(30000)).toBe('0:30');
  });

  it('formats 90 seconds as 1:30', () => {
    expect(formatElapsedTime(90000)).toBe('1:30');
  });

  it('formats over an hour', () => {
    expect(formatElapsedTime(3661000)).toBe('1:01:01');
  });
});

// ── Unit labels ───────────────────────────────────────────────

describe('getPaceUnit', () => {
  it('returns /km for metric', () => {
    expect(getPaceUnit('metric')).toBe('/km');
  });
  it('returns /mi for imperial', () => {
    expect(getPaceUnit('imperial')).toBe('/mi');
  });
});

describe('getDistanceUnit', () => {
  it('returns km for metric', () => {
    expect(getDistanceUnit('metric')).toBe('km');
  });
  it('returns mi for imperial', () => {
    expect(getDistanceUnit('imperial')).toBe('mi');
  });
});
