import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import SummaryScreen from '@/app/tracking/summary';
import { TestWrapper } from '../../helpers/test-wrapper';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ sessionId: 'session-1' }),
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
const mockSession = {
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
};

const mockGetSession = jest.fn().mockResolvedValue(mockSession);
const mockDeleteSession = jest.fn().mockResolvedValue(undefined);
const mockGetRoutePoints = jest.fn().mockResolvedValue([]);
const mockGetSegments = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/database/sessions-repository', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
  deleteSession: (...args: unknown[]) => mockDeleteSession(...args),
}));

jest.mock('@/lib/database/route-repository', () => ({
  getRoutePoints: (...args: unknown[]) => mockGetRoutePoints(...args),
}));

jest.mock('@/lib/database/segments-repository', () => ({
  getSegments: (...args: unknown[]) => mockGetSegments(...args),
}));

describe('SummaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockGetRoutePoints.mockResolvedValue([]);
    mockGetSegments.mockResolvedValue([]);
  });

  it('shows loading state when session data has not resolved', async () => {
    // Make getSession never resolve so the screen stays in loading
    mockGetSession.mockReturnValue(new Promise(() => {}));

    render(<SummaryScreen />, { wrapper: TestWrapper });
    // Wait for SettingsProvider to load, then Loading... becomes visible
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeTruthy();
    });
  });

  it('shows Activity Summary title after loading', async () => {
    render(<SummaryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('Activity Summary')).toBeTruthy();
    });
  });

  it('displays session stats after loading', async () => {
    render(<SummaryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('5.00 km')).toBeTruthy();
      expect(screen.getByText('30:00')).toBeTruthy();
      expect(screen.getByText(/6:00/)).toBeTruthy();
    });
  });

  it('renders Done and Discard buttons', async () => {
    render(<SummaryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('Done')).toBeTruthy();
      expect(screen.getByText('Discard')).toBeTruthy();
    });
  });

  it('has correct accessibility labels on action buttons', async () => {
    render(<SummaryScreen />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(
        screen.getByLabelText('Save activity and return home'),
      ).toBeTruthy();
      expect(screen.getByLabelText('Discard this activity')).toBeTruthy();
    });
  });
});
