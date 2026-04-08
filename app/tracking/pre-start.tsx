import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityTypePicker } from '@/components/tracking/activity-type-picker';
import { useTracking } from '@/lib/tracking/tracking-context';
import {
  requestAllTrackingPermissions,
  hasMinimumPermissions,
} from '@/lib/tracking/permissions';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/lib/settings/settings-context';
import { ActivityColors } from '@/constants/theme';
import type { SessionActivityType } from '@/lib/types';

const ACTIVITY_HINTS: Record<SessionActivityType, string> = {
  walk: 'Perfect for a casual stroll',
  run: 'Lace up and hit the road',
  cycle: 'Time to ride',
  mixed: 'A bit of everything',
};

export default function PreStartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startSession } = useTracking();
  const { weight } = useSettings();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card');

  const [activityType, setActivityType] = useState<SessionActivityType>('walk');
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setStarting(false);
    checkPermissions();
  }, []);

  async function checkPermissions() {
    const ready = await hasMinimumPermissions();
    if (ready) {
      setPermissionsReady(true);
    } else {
      const result = await requestAllTrackingPermissions();
      setPermissionsReady(result.foregroundLocation);
    }
  }

  async function handleStart() {
    if (starting) return;
    setStarting(true);

    try {
      if (!permissionsReady) {
        const result = await requestAllTrackingPermissions();
        if (!result.foregroundLocation) {
          Alert.alert(
            'Location Permission Required',
            'Clash Runs needs location access to track your activity. Please enable it in Settings.',
          );
          setStarting(false);
          return;
        }
      }

      await startSession(activityType, weight);
      router.replace('/tracking/active');
    } catch (e) {
      console.error('Failed to start session:', e);
      Alert.alert('Error', 'Failed to start tracking. Please try again.');
      setStarting(false);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, paddingTop: insets.top },
      ]}
    >
      {/* Header area */}
      <View style={styles.headerArea}>
        <View style={styles.navBar}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={[styles.cancelText, { color: tintColor }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
        <Text style={[styles.screenTitle, { color: textColor }]}>
          New Activity
        </Text>
        <Text style={[styles.screenSubtitle, { color: subtleColor }]}>
          What are you up to?
        </Text>
      </View>

      {/* Picker card */}
      <View style={styles.pickerSection}>
        <View style={[styles.pickerCard, { backgroundColor: cardColor }]}>
          <ActivityTypePicker
            selected={activityType}
            onSelect={setActivityType}
          />
        </View>

        <Text style={[styles.hint, { color: subtleColor }]}>
          {ACTIVITY_HINTS[activityType]}
        </Text>

        {!permissionsReady && (
          <Text style={styles.warning}>
            Location permission is needed to track your route.
          </Text>
        )}
      </View>

      {/* Start button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            starting && styles.startButtonDisabled,
            pressed && !starting && styles.startButtonPressed,
          ]}
          onPress={handleStart}
          disabled={starting}
          accessibilityRole="button"
          accessibilityLabel={
            starting ? 'Starting activity' : `Start ${activityType} activity`
          }
          accessibilityState={{ disabled: starting }}
        >
          <Text style={styles.startButtonText}>
            {starting ? 'Starting...' : 'Start'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  cancelButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },

  // Picker
  pickerSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  pickerCard: {
    borderRadius: 20,
    padding: 20,
  },
  hint: {
    fontSize: 15,
    textAlign: 'center',
  },
  warning: {
    textAlign: 'center',
    fontSize: 14,
    color: '#FF9800',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: ActivityColors.running,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
