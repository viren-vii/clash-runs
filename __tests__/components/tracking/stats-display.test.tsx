import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { StatsDisplay } from '@/components/tracking/stats-display';
import { TestWrapper } from '../../helpers/test-wrapper';

function renderStats(props: Partial<Parameters<typeof StatsDisplay>[0]> = {}) {
  const defaultProps = {
    elapsedTime: 0,
    totalDistance: 0,
    currentPace: null,
    ...props,
  };
  return render(<StatsDisplay {...defaultProps} />, { wrapper: TestWrapper });
}

describe('StatsDisplay', () => {
  describe('grid mode (default)', () => {
    it('renders time, distance, and pace labels', async () => {
      renderStats();
      await waitFor(() => {
        expect(screen.getByText('Time')).toBeTruthy();
        expect(screen.getByText('Distance')).toBeTruthy();
        expect(screen.getByText('Pace')).toBeTruthy();
      });
    });

    it('formats elapsed time', async () => {
      renderStats({ elapsedTime: 90000 });
      await waitFor(() => {
        expect(screen.getByText('1:30')).toBeTruthy();
      });
    });

    it('formats distance in metric', async () => {
      renderStats({ totalDistance: 2500 });
      await waitFor(() => {
        expect(screen.getByText('2.50 km')).toBeTruthy();
      });
    });

    it('shows --:-- when pace is null', async () => {
      renderStats({ currentPace: null });
      await waitFor(() => {
        expect(screen.getByText(/--:--/)).toBeTruthy();
      });
    });

    it('formats valid pace', async () => {
      renderStats({ currentPace: 6.0 });
      await waitFor(() => {
        expect(screen.getByText(/6:00/)).toBeTruthy();
      });
    });
  });

  describe('compact mode', () => {
    it('renders values separated by pipes', async () => {
      renderStats({ compact: true, elapsedTime: 60000, totalDistance: 1000 });
      await waitFor(() => {
        expect(screen.getAllByText(' | ')).toHaveLength(2);
      });
    });

    it('does not render labels in compact mode', async () => {
      renderStats({ compact: true });
      await waitFor(() => {
        expect(screen.getByText(/--:--/)).toBeTruthy(); // ensure rendered
      });
      expect(screen.queryByText('Time')).toBeNull();
      expect(screen.queryByText('Distance')).toBeNull();
      expect(screen.queryByText('Pace')).toBeNull();
    });
  });
});
