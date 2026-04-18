import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

// Expo Router mocks
const mockRedirect = jest.fn();
const mockUsePathname = jest.fn(() => '/');

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) =>
        React.createElement('Stack', null, children),
      {
        Screen: ({ name }: { name: string }) =>
          React.createElement('Stack.Screen', { name }),
      },
    ),
    Redirect: ({ href }: { href: string }) => {
      mockRedirect(href);
      return null;
    },
    usePathname: mockUsePathname,
  };
});

// Font mocks
jest.mock('@expo-google-fonts/space-grotesk', () => ({
  useFonts: () => [true],
  SpaceGrotesk_500Medium: 'SpaceGrotesk_500Medium',
  SpaceGrotesk_700Bold: 'SpaceGrotesk_700Bold',
}));

jest.mock('@expo-google-fonts/inter', () => ({
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-navigation/native', () => ({
  DarkTheme: {},
  DefaultTheme: {},
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    require('react').createElement('ThemeProvider', null, children),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/lib/tracking/tracking-context', () => ({
  TrackingProvider: ({ children }: { children: React.ReactNode }) =>
    require('react').createElement('TrackingProvider', null, children),
}));

jest.mock('@/lib/settings/settings-context', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) =>
    require('react').createElement('SettingsProvider', null, children),
}));

jest.mock('@/lib/database/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/tracking/task-definitions', () => ({}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-reanimated', () => ({}));

// Auth context mock — controlled per-test
let mockIsAuthenticated = false;
let mockIsLoading = false;

jest.mock('@/lib/auth/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) =>
    require('react').createElement('AuthProvider', null, children),
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn(),
    verifyEmail: jest.fn(),
  }),
}));

import RootLayout from '@/app/_layout';

describe('RootLayout auth gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = false;
    mockIsLoading = false;
  });

  it('renders nothing while auth is loading', async () => {
    mockIsLoading = true;
    render(<RootLayout />);
    // InnerLayout returns null when isLoading; no Redirect issued
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to /auth/signin when unauthenticated', async () => {
    mockIsAuthenticated = false;
    mockIsLoading = false;
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('does NOT redirect when authenticated', async () => {
    mockIsAuthenticated = true;
    mockIsLoading = false;
    render(<RootLayout />);
    await waitFor(() => {
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
