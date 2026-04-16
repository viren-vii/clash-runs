import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Import task definitions at module scope (required for TaskManager)
import '@/lib/tracking/task-definitions';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { TrackingProvider } from '@/lib/tracking/tracking-context';
import { SettingsProvider } from '@/lib/settings/settings-context';
import { getDatabase } from '@/lib/database/database';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash may already be hidden in Fast Refresh */
});

export const unstable_settings = {
  anchor: '(tabs)',
};


function InnerLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useSpaceGrotesk({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Initialize database on app mount
  useEffect(() => {
    getDatabase().catch(console.error);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        /* no-op */
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TrackingProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="tracking"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="session/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="recovery"
            options={{ presentation: 'modal', title: 'Recover Session' }}
          />
          <Stack.Screen
            name="onboarding/permissions"
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </TrackingProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <InnerLayout />
    </SettingsProvider>
  );
}
