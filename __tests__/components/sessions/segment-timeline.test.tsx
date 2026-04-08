import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SegmentTimeline } from '@/components/sessions/segment-timeline';
import { TestWrapper } from '../../helpers/test-wrapper';
import type { ActivitySegment } from '@/lib/types';

function makeSegment(
  overrides: Partial<ActivitySegment> & { activityType: ActivitySegment['activityType'] },
): ActivitySegment {
  return {
    sessionId: 'test',
    segmentIndex: 0,
    confidence: null,
    startTime: 1000,
    endTime: 2000,
    distance: 100,
    ...overrides,
  };
}

describe('SegmentTimeline', () => {
  it('returns null for empty segments', async () => {
    const { toJSON } = render(
      <SegmentTimeline segments={[]} totalDuration={60000} />,
      { wrapper: TestWrapper },
    );
    // Even after provider loads, timeline still returns null for empty segments
    await waitFor(() => {
      expect(toJSON()).toBeNull();
    });
  });

  it('returns null for zero duration', async () => {
    const { toJSON } = render(
      <SegmentTimeline
        segments={[makeSegment({ activityType: 'running' })]}
        totalDuration={0}
      />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(toJSON()).toBeNull();
    });
  });

  it('renders segment bars for valid data', async () => {
    render(
      <SegmentTimeline
        segments={[
          makeSegment({ activityType: 'running', startTime: 0, endTime: 30000 }),
          makeSegment({ activityType: 'walking', startTime: 30000, endTime: 60000 }),
        ]}
        totalDuration={60000}
      />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText('Run')).toBeTruthy();
      expect(screen.getByText('Walk')).toBeTruthy();
    });
  });

  it('deduplicates legend entries', async () => {
    render(
      <SegmentTimeline
        segments={[
          makeSegment({ activityType: 'running', segmentIndex: 0, startTime: 0, endTime: 20000 }),
          makeSegment({ activityType: 'running', segmentIndex: 1, startTime: 20000, endTime: 40000 }),
        ]}
        totalDuration={40000}
      />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getAllByText('Run')).toHaveLength(1);
    });
  });

  it('shows stationary as "Stop" in legend', async () => {
    render(
      <SegmentTimeline
        segments={[makeSegment({ activityType: 'stationary', startTime: 0, endTime: 10000 })]}
        totalDuration={10000}
      />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeTruthy();
    });
  });
});
