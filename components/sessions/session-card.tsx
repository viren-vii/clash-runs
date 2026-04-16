import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { RouteMapStatic } from '@/components/tracking/route-map-static';
import {
  calculatePace,
  formatElapsedTime,
  formatDistance,
  formatPace,
  getPaceUnit,
} from '@/lib/tracking/distance-calculator';
import { ThemedText } from '@/components/themed-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatBlock } from '@/components/ui/stat-block';
import { ActivityChip } from '@/components/ui/activity-chip';
import { Radii, Spacing } from '@/constants/theme';
import { useSettings } from '@/lib/settings/settings-context';
import { ACTIVITY_LABELS } from '@/constants/activity';
import type { Session, RoutePoint } from '@/lib/types';

interface SessionCardProps {
  session: Session;
  routePoints: RoutePoint[];
}

export function SessionCard({ session, routePoints }: SessionCardProps) {
  const router = useRouter();
  const { unitSystem } = useSettings();
  const paceUnit = getPaceUnit(unitSystem);

  const date = new Date(session.startTime);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const pace = calculatePace(session.totalDistance, session.elapsedTime);
  const activityLabel = ACTIVITY_LABELS[session.activityType] ?? 'Workout';
  const distanceStr = formatDistance(session.totalDistance, unitSystem);
  const timeStr = formatElapsedTime(session.elapsedTime);

  // Narrow activity type for chip coloring
  const chipType =
    session.activityType === 'run'
      ? 'run'
      : session.activityType === 'cycle'
      ? 'cycle'
      : session.activityType === 'walk'
      ? 'walk'
      : 'unknown';

  return (
    <Pressable
      onPress={() => router.push(`/session/${session.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${activityLabel} on ${dateStr}. ${distanceStr}, ${timeStr}`}
    >
      <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
        <View style={styles.header}>
          <ActivityChip
            type={chipType}
            label={activityLabel}
            size="sm"
          />
          <ThemedText variant="labelMd" color="onSurfaceVariant">
            {dateStr}
          </ThemedText>
        </View>

        <View style={styles.mapWrapper}>
          <RouteMapStatic routePoints={routePoints} height={140} />
        </View>

        {/* Nested higher-tier surface for the stat strip — tonal layering */}
        <SurfaceCard
          tier="surfaceContainer"
          radius="md"
          padding={Spacing.md}
          style={styles.statStrip}
        >
          <StatBlock
            size="sm"
            align="left"
            value={distanceStr}
            label="Distance"
          />
          <StatBlock size="sm" align="center" value={timeStr} label="Time" />
          <StatBlock
            size="sm"
            align="right"
            value={`${formatPace(pace, unitSystem)} ${paceUnit}`}
            label="Pace"
          />
        </SurfaceCard>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mapWrapper: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  statStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
