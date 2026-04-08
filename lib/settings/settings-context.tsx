import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UnitSystem = 'metric' | 'imperial';
export type ThemePreference = 'system' | 'light' | 'dark';

interface Settings {
  unitSystem: UnitSystem;
  themePreference: ThemePreference;
  weight: number; // kg – used for calorie estimation
}

interface SettingsContextValue extends Settings {
  setUnitSystem: (unit: UnitSystem) => void;
  setThemePreference: (theme: ThemePreference) => void;
  setWeight: (weight: number) => void;
}

const STORAGE_KEY = 'clash_runs_settings';

const defaults: Settings = {
  unitSystem: 'metric',
  themePreference: 'system',
  weight: 70,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loaded, setLoaded] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error('[Settings] Failed to load:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('[Settings] Failed to persist:', e);
    }
  }, []);

  const setUnitSystem = useCallback(
    (unitSystem: UnitSystem) => {
      setSettings((prev) => {
        const next = { ...prev, unitSystem };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setThemePreference = useCallback(
    (themePreference: ThemePreference) => {
      setSettings((prev) => {
        const next = { ...prev, themePreference };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setWeight = useCallback(
    (weight: number) => {
      setSettings((prev) => {
        const next = { ...prev, weight };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // Don't render children until settings are loaded to prevent flash
  if (!loaded) return null;

  return (
    <SettingsContext.Provider
      value={{ ...settings, setUnitSystem, setThemePreference, setWeight }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
