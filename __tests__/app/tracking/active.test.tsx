import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ActiveTrackingScreen from '@/app/tracking/active';
import { TestWrapper } from '../../helpers/test-wrapper';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock RouteMap (needs MapView ref which can't work in tests)
jest.mock('@/components/tracking/route-map', () => ({
  RouteMap: () => 'RouteMap',
}));

// Tracking context mock
const mockPauseSession = jest.fn();
const mockResumeSession = jest.fn();
const mockStopSession = jest.fn();
let mockState = {
  isTracking: true,
  sessionId: 'session-1',
  status: 'active' as const,
  elapsedTime: 120000, // 2 min
  totalDistance: 500,
  currentPace: 6.0,
  currentSpeed: 2.78,
  currentActivity: 'running' as const,
  segmentIndex: 0,
  currentLocation: null,
  routePoints: [],
};

jest.mock('@/lib/tracking/tracking-context', () => ({
  useTracking: () => ({
    state: mockState,
    pauseSession: mockPauseSession,
    resumeSession: mockResumeSession,
    stopSession: mockStopSession,
  }),
}));

function renderScreen() {
  return render(<ActiveTrackingScreen />, { wrapper: TestWrapper });
}

describe('ActiveTrackingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      isTracking: true,
      sessionId: 'session-1',
      status: 'active',
      elapsedTime: 120000,
      totalDistance: 500,
      currentPace: 6.0,
      currentSpeed: 2.78,
      currentActivity: 'running',
      segmentIndex: 0,
      currentLocation: null,
      routePoints: [],
    };
  });

  it('shows "Tracking" status when active', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Tracking')).toBeTruthy();
    });
  });

  it('shows "Paused" status when paused', async () => {
    mockState = { ...mockState, status: 'paused' };
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeTruthy();
    });
  });

  it('renders stats display with current values', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('2:00')).toBeTruthy();
      expect(screen.getByText('500 m')).toBeTruthy();
      expect(screen.getByText(/6:00/)).toBeTruthy();
    });
  });

  it('renders PAUSE and STOP buttons when active', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('PAUSE')).toBeTruthy();
      expect(screen.getByText('STOP')).toBeTruthy();
    });
  });

  it('renders RESUME and STOP buttons when paused', async () => {
    mockState = { ...mockState, status: 'paused' };
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('RESUME')).toBeTruthy();
      expect(screen.getByText('STOP')).toBeTruthy();
    });
  });

  it('calls pauseSession on PAUSE press', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('PAUSE')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('PAUSE'));
    expect(mockPauseSession).toHaveBeenCalled();
  });

  it('calls resumeSession on RESUME press', async () => {
    mockState = { ...mockState, status: 'paused' };
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('RESUME')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('RESUME'));
    expect(mockResumeSession).toHaveBeenCalled();
  });

  it('has accessibility labels for status', async () => {
    renderScreen();
    await waitFor(() => {
      expect(
        screen.getByLabelText('Activity tracking is active'),
      ).toBeTruthy();
    });
  });

  it('has paused accessibility label when paused', async () => {
    mockState = { ...mockState, status: 'paused' };
    renderScreen();
    await waitFor(() => {
      expect(
        screen.getByLabelText('Activity tracking is paused'),
      ).toBeTruthy();
    });
  });
});
