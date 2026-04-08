import React from 'react';
import { StyleSheet, View, Text, Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteMap } from '@/components/tracking/route-map';
import { StatsDisplay } from '@/components/tracking/stats-display';
import { ControlButtons } from '@/components/tracking/control-buttons';
import { useTracking } from '@/lib/tracking/tracking-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { StatusColors } from '@/constants/theme';
import type { SessionSummary } from '@/lib/types';

export default function ActiveTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, pauseSession, resumeSession, stopSession } = useTracking();
  const bgColor = useThemeColor({}, 'background');
  const panelBg = useThemeColor(
    { light: 'rgba(255,255,255,0.97)', dark: 'rgba(21,23,24,0.97)' },
    'background',
  );
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();

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

  const statusColor =
    state.status === 'active' ? StatusColors.active : StatusColors.paused;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Status indicator */}
      <View
        style={[
          styles.statusBar,
          { backgroundColor: statusColor, paddingTop: insets.top },
        ]}
        accessibilityRole="header"
        accessibilityLabel={
          state.status === 'active'
            ? 'Activity tracking is active'
            : 'Activity tracking is paused'
        }
      >
        <Text style={styles.statusText}>
          {state.status === 'active' ? 'Tracking' : 'Paused'}
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <RouteMap />
      </View>

      {/* Bottom panel */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: panelBg,
            paddingBottom: insets.bottom + 8,
            shadowColor: colorScheme === 'dark' ? '#000' : '#666',
          },
        ]}
      >
        <View style={styles.panelHandle} />
        <StatsDisplay
          elapsedTime={state.elapsedTime}
          totalDistance={state.totalDistance}
          currentPace={state.currentPace}
        />
        <ControlButtons
          status={state.status === 'active' ? 'active' : 'paused'}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={handleStop}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  mapContainer: {
    flex: 1,
  },
  panel: {
    paddingHorizontal: 20,
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginBottom: 8,
  },
});
