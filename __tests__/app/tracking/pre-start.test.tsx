import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PreStartScreen from '@/app/tracking/pre-start';
import { TestWrapper } from '../../helpers/test-wrapper';

// Mock expo-router
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock tracking context
const mockStartSession = jest.fn().mockResolvedValue('session-1');
jest.mock('@/lib/tracking/tracking-context', () => ({
  useTracking: () => ({
    startSession: mockStartSession,
  }),
}));

// Mock permissions
const mockHasMinimumPermissions = jest.fn().mockResolvedValue(true);
const mockRequestAllTrackingPermissions = jest.fn().mockResolvedValue({
  foregroundLocation: true,
  backgroundLocation: true,
});
jest.mock('@/lib/tracking/permissions', () => ({
  hasMinimumPermissions: (...args: unknown[]) => mockHasMinimumPermissions(...args),
  requestAllTrackingPermissions: (...args: unknown[]) =>
    mockRequestAllTrackingPermissions(...args),
}));

function renderScreen() {
  return render(<PreStartScreen />, { wrapper: TestWrapper });
}

describe('PreStartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasMinimumPermissions.mockResolvedValue(true);
    mockRequestAllTrackingPermissions.mockResolvedValue({
      foregroundLocation: true,
      backgroundLocation: true,
    });
    mockStartSession.mockResolvedValue('session-1');
  });

  it('renders screen title and subtitle', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('New Activity')).toBeTruthy();
    });
    expect(screen.getByText('What are you up to?')).toBeTruthy();
  });

  it('renders activity type picker with all options', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Walk')).toBeTruthy();
    });
    expect(screen.getByText('Run')).toBeTruthy();
    expect(screen.getByText('Cycle')).toBeTruthy();
  });

  it('renders Start button', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Start')).toBeTruthy();
    });
  });

  it('renders Cancel button that goes back', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeTruthy();
    });
    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('shows hint text for selected activity', async () => {
    renderScreen();
    // Default is 'walk'
    await waitFor(() => {
      expect(screen.getByText('Perfect for a casual stroll')).toBeTruthy();
    });
  });

  it('starts session and navigates on Start press', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Start')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Start'));

    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledWith('walk', 70);
      expect(mockReplace).toHaveBeenCalledWith('/tracking/active');
    });
  });

  it('shows permission warning when permissions not granted', async () => {
    mockHasMinimumPermissions.mockResolvedValue(false);
    mockRequestAllTrackingPermissions.mockResolvedValue({
      foregroundLocation: false,
      backgroundLocation: false,
    });

    renderScreen();

    await waitFor(() => {
      expect(
        screen.getByText('Location permission is needed to track your route.'),
      ).toBeTruthy();
    });
  });

  it('changes activity type when picker is used', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Run')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Run activity'));

    // Hint should change
    await waitFor(() => {
      expect(screen.getByText('Lace up and hit the road')).toBeTruthy();
    });

    // Starting should use the selected type
    fireEvent.press(screen.getByText('Start'));
    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledWith('run', 70);
    });
  });
});
