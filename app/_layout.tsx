import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, Platform } from 'react-native';
import 'react-native-reanimated';

// Import task definitions at module scope (required for TaskManager)
import '@/lib/tracking/task-definitions';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { TrackingProvider } from '@/lib/tracking/tracking-context';
import { SettingsProvider } from '@/lib/settings/settings-context';
import { getDatabase } from '@/lib/database/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

function SessionBackButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = colorScheme === 'dark' ? '#66BB6A' : '#4CAF50';

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={{ marginLeft: Platform.OS === 'ios' ? -8 : 0 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={{ color: tint, fontSize: 17 }}>
        {Platform.OS === 'ios' ? '‹ Back' : '←'}
      </Text>
    </Pressable>
  );
}

function InnerLayout() {
  const colorScheme = useColorScheme();

  // Initialize database on app mount
  useEffect(() => {
    getDatabase().catch(console.error);
  }, []);

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
            options={{
              title: 'Session Details',
              headerLeft: () => <SessionBackButton />,
            }}
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
