import React from 'react';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { RouteMap } from '@/components/tracking/route-map';
import { StatsDisplay } from '@/components/tracking/stats-display';
import { ControlButtons } from '@/components/tracking/control-buttons';
import { useTracking } from '@/lib/tracking/tracking-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PageInsets,
  Radii,
  Spacing,
} from '@/constants/theme';
import type { SessionSummary } from '@/lib/types';

export default function ActiveTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, pauseSession, resumeSession, stopSession } = useTracking();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const bgColor = useThemeColor({}, 'surface');
  const handleColor = useThemeColor({}, 'outlineVariant');

  const handleStop = () => {
    Alert.alert(
      'Finish Activity',
      'Are you sure you want to stop tracking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'destructive',
          onPress: async () => {
            try {
              const summary: SessionSummary = await stopSession();
              router.replace({
                pathname: '/tracking/summary',
                params: { sessionId: summary.session.id },
              });
            } catch (e) {
              console.error('Failed to stop session:', e);
              Alert.alert('Error', 'Failed to stop tracking. Please try again.');
            }
          },
        },
      ],
    );
  };

  const isActive = state.status === 'active';
  // Active: scheme's primary (bright lime on dark, deep lime on light) so the
  // "pulse" feels alive without blinding the user in light mode. Paused: a
  // muted surface tier — communicates "not live" without alarm.
  const statusColor = isActive ? palette.primary : palette.surfaceContainerHigh;
  const statusTextColor = isActive ? palette.onPrimary : palette.onSurfaceVariant;
  // Dark mode: rgba(0,0,0,0.55). Light mode: rgba(255,255,255,0.55).
  const scrimOverlay =
    scheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Status bar — Electric Lime when live, neutral when paused */}
      <View
        style={[
          styles.statusBar,
          { backgroundColor: statusColor, paddingTop: insets.top },
        ]}
        accessibilityRole="header"
        accessibilityLabel={
          isActive
            ? 'Activity tracking is active'
            : 'Activity tracking is paused'
        }
      >
        <ThemedText
          variant="labelLg"
          style={[styles.statusText, { color: statusTextColor }]}
        >
          {isActive ? 'Tracking' : 'Paused'}
        </ThemedText>
      </View>

      {/* Full-bleed map */}
      <View style={styles.mapContainer}>
        <RouteMap />
      </View>

      {/* Live HUD — BlurView over the map with a scrim tint.
          Spec: 60% scrim + 20px backdrop blur for the live-HUD pattern. */}
      <BlurView
        tint={scheme === 'dark' ? 'dark' : 'light'}
        intensity={Platform.OS === 'ios' ? 60 : 90}
        style={[
          styles.panel,
          { paddingBottom: insets.bottom + Spacing.sm },
        ]}
      >
        {/* Scrim color overlay — Android's BlurView doesn't darken reliably on its own */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: scrimOverlay }]}
        />
        <View
          style={[styles.panelHandle, { backgroundColor: handleColor }]}
        />
        <StatsDisplay
          elapsedTime={state.elapsedTime}
          totalDistance={state.totalDistance}
          currentPace={state.currentPace}
        />
        <ControlButtons
          status={isActive ? 'active' : 'paused'}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={handleStop}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  statusText: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  mapContainer: {
    flex: 1,
  },
  panel: {
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    paddingTop: Spacing.sm,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    marginTop: -Spacing.xl,
    overflow: 'hidden',
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
});
