import React from 'react';
import { SettingsProvider } from '@/lib/settings/settings-context';

/**
 * Wraps a component in all required providers for testing.
 * SettingsProvider reads from AsyncStorage (mocked in jest.setup.ts).
 * Use with `waitFor` since SettingsProvider is async on mount.
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

// Prevent Jest from treating this file as a test suite
export {};
