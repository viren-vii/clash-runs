import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from '@/lib/settings/settings-context';

/**
 * Returns the effective color scheme, respecting the user's theme preference.
 * Falls back to system default if preference is 'system' or settings aren't loaded.
 */
export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme() ?? 'light';

  try {
    const { themePreference } = useSettings();
    if (themePreference === 'system') return systemScheme;
    return themePreference;
  } catch {
    // Settings provider not yet available (e.g. during initial render)
    return systemScheme;
  }
}
