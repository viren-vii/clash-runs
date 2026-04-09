import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HistoryScreen from '@/app/(tabs)/history';
import { TestWrapper } from '../../helpers/test-wrapper';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    // Simulate focus by calling the callback immediately
    const React = require('react');
    React.useEffect(() => { cb(); }, []);
  },
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock RouteMapStatic
jest.mock('@/components/tracking/route-map-static', () => ({
  RouteMapStatic: () => 'RouteMapStatic',
}));

// Mock database
const mockGetAllSessions = jest.fn().mockResolvedValue([]);
const mockGetRoutePoints = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/database/sessions-repository', () => ({
  getAllSessions: (...args: unknown[]) => mockGetAllSessions(...args),
}));
jest.mock('@/lib/database/route-repository', () => ({
  getRoutePoints: (...args: unknown[]) => mockGetRoutePoints(...args),
}));

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllSessions.mockResolvedValue([]);
    mockGetRoutePoints.mockResolvedValue([]);
  });

  it('renders History title', async () => {
    render(<HistoryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('History')).toBeTruthy();
    });
  });

  it('shows empty state when no sessions', async () => {
    render(<HistoryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(
        screen.getByText('No completed activities yet.'),
      ).toBeTruthy();
    });
  });

  it('renders session cards when sessions exist', async () => {
    mockGetAllSessions.mockResolvedValue([
      {
        id: 'session-1',
        startTime: new Date('2025-04-01T08:00:00').getTime(),
        endTime: new Date('2025-04-01T08:30:00').getTime(),
        status: 'completed',
        totalDistance: 5000,
        totalSteps: 6000,
        elapsedTime: 1800000,
        activityType: 'run',
        userWeight: 70,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
    mockGetRoutePoints.mockResolvedValue([]);

    render(<HistoryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText(/🏃/)).toBeTruthy();
      expect(screen.getByText(/Run/)).toBeTruthy();
      expect(screen.getByText('5.00 km')).toBeTruthy();
    });
  });

  it('renders multiple sessions', async () => {
    mockGetAllSessions.mockResolvedValue([
      {
        id: 'session-1',
        startTime: Date.now() - 86400000,
        endTime: Date.now() - 86400000 + 1800000,
        status: 'completed',
        totalDistance: 5000,
        totalSteps: 0,
        elapsedTime: 1800000,
        activityType: 'run',
        userWeight: 70,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'session-2',
        startTime: Date.now() - 172800000,
        endTime: Date.now() - 172800000 + 3600000,
        status: 'completed',
        totalDistance: 3000,
        totalSteps: 0,
        elapsedTime: 2400000,
        activityType: 'walk',
        userWeight: 70,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    render(<HistoryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText(/🏃/)).toBeTruthy();
      expect(screen.getByText(/🚶/)).toBeTruthy();
    });
  });
});
