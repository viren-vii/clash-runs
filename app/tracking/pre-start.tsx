import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
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
import { ThemedText } from '@/components/themed-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { WarningBanner } from '@/components/ui/warning-banner';
import { PageInsets, Spacing } from '@/constants/theme';
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
  const bgColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'primary');

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
      <View style={styles.headerArea}>
        <View style={styles.navBar}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <ThemedText variant="titleMd" style={{ color: tintColor }}>
              Cancel
            </ThemedText>
          </Pressable>
        </View>
        <ThemedText
          variant="displaySm"
          color="onSurface"
          style={styles.screenTitle}
        >
          New Activity
        </ThemedText>
        <ThemedText
          variant="bodyLg"
          color="onSurfaceVariant"
          style={styles.screenSubtitle}
        >
          What are you up to?
        </ThemedText>
      </View>

      <View style={styles.pickerSection}>
        <SurfaceCard
          tier="surfaceContainerLow"
          radius="xl"
          padding={Spacing.lg}
        >
          <ActivityTypePicker
            selected={activityType}
            onSelect={setActivityType}
          />
        </SurfaceCard>

        <ThemedText
          variant="bodyMd"
          color="onSurfaceVariant"
          style={styles.hint}
        >
          {ACTIVITY_HINTS[activityType]}
        </ThemedText>

        {!permissionsReady && (
          <WarningBanner
            severity="warning"
            message="Location permission is needed to track your route."
          />
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={starting ? 'Starting...' : 'Start'}
          size="lg"
          onPress={handleStart}
          disabled={starting}
          accessibilityLabel={
            starting ? 'Starting activity' : `Start ${activityType} activity`
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    paddingBottom: Spacing.sm,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  cancelButton: {
    minWidth: 60,
  },
  screenTitle: {
    letterSpacing: -0.72,
  },
  screenSubtitle: {
    marginTop: Spacing.xs,
  },
  pickerSection: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    gap: Spacing.lg,
  },
  hint: {
    textAlign: 'center',
  },
  footer: {
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
  },
});
