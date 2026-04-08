import React from 'react';
import { StyleSheet, View, Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { RouteMapStatic } from '@/components/tracking/route-map-static';
import {
  formatElapsedTime,
  formatDistance,
  formatPace,
  getPaceUnit,
} from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/lib/settings/settings-context';
import type { Session, RoutePoint } from '@/lib/types';

interface SessionCardProps {
  session: Session;
  routePoints: RoutePoint[];
}

const ACTIVITY_EMOJI: Record<string, string> = {
  run: '🏃',
  walk: '🚶',
  cycle: '🚴',
  mixed: '🏋️',
};

const ACTIVITY_LABELS: Record<string, string> = {
  run: 'Run',
  walk: 'Walk',
  cycle: 'Ride',
  mixed: 'Workout',
};

export function SessionCard({ session, routePoints }: SessionCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const subtleColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const { unitSystem } = useSettings();
  const paceUnit = getPaceUnit(unitSystem);

  const date = new Date(session.startTime);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const pace =
    session.totalDistance > 0 && session.elapsedTime > 0
      ? session.elapsedTime / 60000 / (session.totalDistance / 1000)
      : null;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: cardColor,
          shadowColor: colorScheme === 'dark' ? '#000' : '#888',
        },
      ]}
      onPress={() => router.push(`/session/${session.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${ACTIVITY_LABELS[session.activityType] ?? 'Workout'} on ${dateStr}. ${formatDistance(session.totalDistance, unitSystem)}, ${formatElapsedTime(session.elapsedTime)}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.activityType, { color: textColor }]}>
          {ACTIVITY_EMOJI[session.activityType] ?? '🏋️'}{' '}
          {ACTIVITY_LABELS[session.activityType] ?? 'Workout'}
        </Text>
        <Text style={[styles.date, { color: subtleColor }]}>{dateStr}</Text>
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        <RouteMapStatic routePoints={routePoints} height={140} />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { borderTopColor: borderColor }]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {formatDistance(session.totalDistance, unitSystem)}
          </Text>
          <Text style={[styles.statLabel, { color: subtleColor }]}>
            Distance
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {formatElapsedTime(session.elapsedTime)}
          </Text>
          <Text style={[styles.statLabel, { color: subtleColor }]}>Time</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {formatPace(pace, unitSystem)} {paceUnit}
          </Text>
          <Text style={[styles.statLabel, { color: subtleColor }]}>Pace</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityType: {
    fontSize: 17,
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
  },
  mapWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: -4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
