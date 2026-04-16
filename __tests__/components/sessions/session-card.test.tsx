import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SessionCard } from '@/components/sessions/session-card';
import { TestWrapper } from '../../helpers/test-wrapper';
import type { Session } from '@/lib/types';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock RouteMapStatic since it depends on react-native-maps internals
jest.mock('@/components/tracking/route-map-static', () => ({
  RouteMapStatic: () => 'RouteMapStatic',
}));

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    startTime: new Date('2025-04-01T08:00:00').getTime(),
    endTime: new Date('2025-04-01T08:30:00').getTime(),
    status: 'completed',
    totalDistance: 5000, // 5km
    totalSteps: 6000,
    elapsedTime: 1800000, // 30 min
    activityType: 'run',
    userWeight: 70,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('SessionCard', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders activity type label and Lucide icon', async () => {
    render(
      <SessionCard session={makeSession()} routePoints={[]} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText(/Run/)).toBeTruthy();
    });
  });

  it('renders walk activity correctly', async () => {
    render(
      <SessionCard session={makeSession({ activityType: 'walk' })} routePoints={[]} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText(/Walk/)).toBeTruthy();
    });
  });

  it('renders cycle activity correctly', async () => {
    render(
      <SessionCard session={makeSession({ activityType: 'cycle' })} routePoints={[]} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText(/Ride/)).toBeTruthy();
    });
  });

  it('renders formatted distance', async () => {
    render(
      <SessionCard session={makeSession({ totalDistance: 5000 })} routePoints={[]} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText('5.00 km')).toBeTruthy();
    });
  });

  it('renders formatted elapsed time', async () => {
    render(
      <SessionCard session={makeSession({ elapsedTime: 1800000 })} routePoints={[]} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText('30:00')).toBeTruthy();
    });
  });

  it('renders pace for valid session', async () => {
    render(
      <SessionCard
        session={makeSession({ totalDistance: 5000, elapsedTime: 1800000 })}
        routePoints={[]}
      />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText(/6:00/)).toBeTruthy();
    });
  });

  it('renders --:-- pace when distance is 0', async () => {
    render(
      <SessionCard
        session={makeSession({ totalDistance: 0, elapsedTime: 1800000 })}
        routePoints={[]}
      />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByText(/--:--/)).toBeTruthy();
    });
  });

  it('navigates to session detail on press', async () => {
    render(
      <SessionCard session={makeSession({ id: 'abc-123' })} routePoints={[]} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeTruthy();
    });
    fireEvent.press(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/session/abc-123');
  });

  it('has accessibility label with key info', async () => {
    render(
      <SessionCard session={makeSession()} routePoints={[]} />,
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeTruthy();
    });
    const button = screen.getByRole('button');
    expect(button.props.accessibilityLabel).toContain('Run');
    expect(button.props.accessibilityLabel).toContain('5.00 km');
    expect(button.props.accessibilityLabel).toContain('30:00');
  });
});
