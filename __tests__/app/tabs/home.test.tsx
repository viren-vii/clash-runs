import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';
import { TestWrapper } from '../../helpers/test-wrapper';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock RouteMapStatic
jest.mock('@/components/tracking/route-map-static', () => ({
  RouteMapStatic: () => 'RouteMapStatic',
}));

// Tracking context — default idle
let mockTrackingState = {
  isTracking: false,
  sessionId: null,
  status: 'idle' as const,
  elapsedTime: 0,
  totalDistance: 0,
  currentPace: null,
  currentSpeed: null,
  currentActivity: 'unknown' as const,
  segmentIndex: 0,
  currentLocation: null,
  routePoints: [],
};

jest.mock('@/lib/tracking/tracking-context', () => ({
  useTracking: () => ({ state: mockTrackingState }),
}));

// Mock database — default empty
const mockGetAllSessions = jest.fn().mockResolvedValue([]);
const mockGetRoutePoints = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/database/sessions-repository', () => ({
  getAllSessions: (...args: unknown[]) => mockGetAllSessions(...args),
}));
jest.mock('@/lib/database/route-repository', () => ({
  getRoutePoints: (...args: unknown[]) => mockGetRoutePoints(...args),
}));

function renderScreen() {
  return render(<HomeScreen />, { wrapper: TestWrapper });
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackingState = {
      isTracking: false,
      sessionId: null,
      status: 'idle',
      elapsedTime: 0,
      totalDistance: 0,
      currentPace: null,
      currentSpeed: null,
      currentActivity: 'unknown',
      segmentIndex: 0,
      currentLocation: null,
      routePoints: [],
    };
    mockGetAllSessions.mockResolvedValue([]);
    mockGetRoutePoints.mockResolvedValue([]);
  });

  it('renders app title', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Clash Runs')).toBeTruthy();
    });
  });

  it('renders "Start Activity" button when idle', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Start Activity')).toBeTruthy();
    });
  });

  it('shows empty state when no sessions', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Ready to go?')).toBeTruthy();
      expect(
        screen.getByText(/Start your first activity/),
      ).toBeTruthy();
    });
  });

  it('shows This Week chart section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('This Week')).toBeTruthy();
    });
  });

  it('shows day labels in chart', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeTruthy();
      expect(screen.getByText('Sun')).toBeTruthy();
    });
  });

  it('shows week summary stats', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Activities')).toBeTruthy();
      expect(screen.getByText('Distance')).toBeTruthy();
      expect(screen.getByText('Time')).toBeTruthy();
    });
  });

  it('shows active tracking banner when session is active', async () => {
    mockTrackingState = {
      ...mockTrackingState,
      isTracking: true,
      status: 'active',
      elapsedTime: 60000,
      totalDistance: 200,
    };

    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Tracking in progress')).toBeTruthy();
      expect(screen.getByText('Tap to return')).toBeTruthy();
    });
  });

  it('shows paused banner when session is paused', async () => {
    mockTrackingState = {
      ...mockTrackingState,
      isTracking: true,
      status: 'paused',
      elapsedTime: 60000,
    };

    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeTruthy();
    });
  });

  it('hides Start Activity button when session is active', async () => {
    mockTrackingState = {
      ...mockTrackingState,
      isTracking: true,
      status: 'active',
    };

    renderScreen();
    await waitFor(() => {
      expect(screen.queryByText('Start Activity')).toBeNull();
    });
  });

  it('shows Last Activity card when sessions exist', async () => {
    mockGetAllSessions.mockResolvedValue([
      {
        id: 'session-1',
        startTime: Date.now() - 86400000,
        endTime: Date.now() - 86400000 + 1800000,
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

    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Last Activity')).toBeTruthy();
      expect(screen.getByText(/🏃/)).toBeTruthy();
      // 5.00 km appears in both the weekly summary and last activity card
      expect(screen.getAllByText('5.00 km').length).toBeGreaterThanOrEqual(1);
    });
  });
});
