import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMapStatic } from '@/components/tracking/route-map-static';
import { SegmentTimeline } from '@/components/sessions/segment-timeline';
import { getSession, deleteSession } from '@/lib/database/sessions-repository';
import { getRoutePoints } from '@/lib/database/route-repository';
import { getSegments } from '@/lib/database/segments-repository';
import {
  calculatePace,
  calculateSpeed,
  formatDistance,
  formatElapsedTime,
  formatPace,
  getPaceUnit,
} from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/lib/settings/settings-context';
import { ThemedText } from '@/components/themed-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatBlock } from '@/components/ui/stat-block';
import { ActivityChip } from '@/components/ui/activity-chip';
import { SecondaryButton } from '@/components/ui/primary-button';
import { Icon, ACTIVITY_ICON } from '@/components/ui/icon';
import { Skeleton, SkeletonLines } from '@/components/ui/skeleton';
import { Colors, getActivityColors, PageInsets, Radii, Spacing } from '@/constants/theme';
import { ACTIVITY_LABELS } from '@/constants/activity';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Session, RoutePoint, ActivitySegment, SessionActivityType } from '@/lib/types';

export default function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const activityColors = getActivityColors(scheme);
  const ACTIVITY_ACCENT: Record<string, string> = {
    run: activityColors.running,
    walk: activityColors.walking,
    cycle: activityColors.cycling,
  };
  const bgColor = palette.surface;
  const dividerColor = useThemeColor({}, 'outlineVariant');
  const { unitSystem } = useSettings();
  const paceUnit = getPaceUnit(unitSystem);

  const [session, setSession] = useState<Session | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [segments, setSegments] = useState<ActivitySegment[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getSession(id), getRoutePoints(id), getSegments(id)]).then(
      ([s, rp, seg]) => {
        setSession(s);
        setRoutePoints(rp);
        setSegments(seg);
      },
    );
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Activity', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) await deleteSession(id);
          router.back();
        },
      },
    ]);
  };

  // Custom nav bar — shared between loading and loaded states
  const NavBar = ({ label }: { label?: string }) => (
    <View style={[styles.navBar, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Icon name="chevronLeft" size={28} color="onSurface" />
      </Pressable>
      {label ? (
        <ThemedText variant="titleMd" color="onSurface" style={styles.navTitle}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <NavBar />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing['2xl'] },
          ]}
          scrollEnabled={false}
        >
          <Skeleton width="60%" height={36} radius="md" />
          <Skeleton width="100%" height={260} radius="xl" style={{ marginTop: Spacing.md }} />
          <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
            <SkeletonLines count={3} />
          </SurfaceCard>
        </ScrollView>
      </View>
    );
  }

  const pace = calculatePace(session.totalDistance, session.elapsedTime);
  const speed = calculateSpeed(session.totalDistance, session.elapsedTime);
  const date = new Date(session.startTime);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startTimeStr = new Date(session.startTime).toLocaleTimeString(
    undefined,
    { hour: '2-digit', minute: '2-digit' },
  );
  const endTimeStr = session.endTime
    ? new Date(session.endTime).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const avgSpeedFormatted =
    speed !== null
      ? unitSystem === 'imperial'
        ? `${((speed * 3600) / 1609.344).toFixed(1)} mph`
        : `${((speed * 3600) / 1000).toFixed(1)} km/h`
      : '--';

  const MET_VALUES: Record<string, number> = {
    walk: 3.5, run: 9.8, cycle: 7.5, mixed: 5.0,
  };
  const met = MET_VALUES[session.activityType] ?? 5.0;
  const durationHrs = session.elapsedTime / 3_600_000;
  const estimatedCalories = Math.round(met * session.userWeight * durationHrs);

  const altitudes = routePoints
    .map((p) => p.altitude)
    .filter((a): a is number => a !== null);
  const elevationGain =
    altitudes.length > 1
      ? altitudes.reduce((gain, alt, i) => {
          if (i === 0) return 0;
          const diff = alt - altitudes[i - 1];
          return diff > 0 ? gain + diff : gain;
        }, 0)
      : null;
  const elevationFormatted =
    elevationGain !== null
      ? unitSystem === 'imperial'
        ? `${Math.round(elevationGain * 3.28084)} ft`
        : `${Math.round(elevationGain)} m`
      : '--';

  const accent = ACTIVITY_ACCENT[session.activityType] ?? activityColors.unknown;
  const activityLabel = ACTIVITY_LABELS[session.activityType] ?? 'Workout';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Custom nav bar */}
      <NavBar />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Activity identity header */}
        <View style={styles.identityRow}>
          <View style={[styles.activityIcon, { backgroundColor: `${accent}22` }]}>
            <Icon
              name={ACTIVITY_ICON[session.activityType as SessionActivityType] ?? 'mixed'}
              size={28}
              color={accent}
            />
          </View>
          <View style={styles.identityText}>
            <ThemedText variant="headlineSm" color="onSurface">
              {activityLabel}
            </ThemedText>
            <ThemedText variant="bodyMd" color="onSurfaceVariant">
              {dateStr}
            </ThemedText>
          </View>
          <ActivityChip
            type={(session.activityType as 'run' | 'walk' | 'cycle') ?? 'unknown'}
            label={activityLabel}
            size="sm"
          />
        </View>

        {/* Hero metrics — primary color for the two headline numbers */}
        <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
          <View style={styles.heroStats}>
            <StatBlock
              size="xl"
              align="center"
              value={formatDistance(session.totalDistance, unitSystem)}
              label="Distance"
              valueColor="primary"
              style={styles.heroStat}
            />
            <View style={[styles.heroDivider, { backgroundColor: dividerColor }]} />
            <StatBlock
              size="xl"
              align="center"
              value={formatElapsedTime(session.elapsedTime)}
              label="Duration"
              valueColor="primary"
              style={styles.heroStat}
            />
          </View>
        </SurfaceCard>

        {/* Route map */}
        <View style={styles.mapCard}>
          <RouteMapStatic routePoints={routePoints} height={220} activityType={
            session.activityType === 'run' ? 'running'
            : session.activityType === 'walk' ? 'walking'
            : session.activityType === 'cycle' ? 'cycling'
            : 'running'
          } />
        </View>

        {/* Secondary metrics — 2×2 */}
        <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
          <View style={styles.secondaryGrid}>
            <View style={styles.secondaryCell}>
              <StatBlock size="md" align="center"
                value={formatPace(pace, unitSystem)}
                label={`Avg Pace (${paceUnit.replace('/', '')})`}
              />
            </View>
            <View style={styles.secondaryCell}>
              <StatBlock size="md" align="center"
                value={avgSpeedFormatted}
                label="Avg Speed"
              />
            </View>
            <View
              style={[
                styles.secondaryCell,
                styles.secondaryCellBorderTop,
                { borderTopColor: dividerColor },
              ]}
            >
              <StatBlock size="md" align="center"
                value={estimatedCalories > 0 ? `${estimatedCalories} kcal` : '--'}
                label="Calories (est.)"
              />
            </View>
            <View
              style={[
                styles.secondaryCell,
                styles.secondaryCellBorderTop,
                { borderTopColor: dividerColor },
              ]}
            >
              <StatBlock size="md" align="center"
                value={elevationFormatted}
                label="Elev. Gain"
              />
            </View>
          </View>
        </SurfaceCard>

        {/* Segment timeline */}
        {segments.length > 0 && (
          <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
            <ThemedText variant="titleMd" color="onSurface" style={styles.sectionTitle}>
              Activity Segments
            </ThemedText>
            <SegmentTimeline segments={segments} totalDuration={session.elapsedTime} />
          </SurfaceCard>
        )}

        {/* Time details */}
        <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
          <ThemedText variant="titleMd" color="onSurface" style={styles.sectionTitle}>
            Details
          </ThemedText>
          <View>
            <DetailRow label="Started" value={startTimeStr} divider={dividerColor} />
            {endTimeStr && (
              <DetailRow label="Finished" value={endTimeStr} divider={dividerColor} />
            )}
            {session.endTime && (
              <DetailRow
                label="Total Time"
                value={formatElapsedTime(session.endTime - session.startTime)}
                divider={dividerColor}
              />
            )}
            {session.endTime &&
              session.elapsedTime < session.endTime - session.startTime - 1000 && (
                <DetailRow
                  label="Paused Time"
                  value={formatElapsedTime(
                    session.endTime - session.startTime - session.elapsedTime,
                  )}
                  divider={dividerColor}
                  last
                />
              )}
          </View>
        </SurfaceCard>

        {/* Delete — ghost red */}
        <SecondaryButton
          label="Delete Activity"
          size="md"
          destructive
          onPress={handleDelete}
          accessibilityLabel="Delete this activity"
        />
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label, value, divider, last,
}: {
  label: string; value: string; divider: string; last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && { borderBottomColor: divider, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <ThemedText variant="bodyMd" color="onSurfaceVariant">{label}</ThemedText>
      <ThemedText variant="bodyMd" color="onSurface" tabular>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PageInsets.left,
    paddingBottom: Spacing.xs,
    minHeight: 44,
  },
  backBtn: {
    marginLeft: -4,
    marginRight: Spacing.sm,
  },
  navTitle: {
    flex: 1,
  },

  // Content
  content: {
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },

  // Identity row
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    gap: 2,
  },

  // Hero
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroStat: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 52,
    marginHorizontal: Spacing.md,
  },

  // Map
  mapCard: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },

  // Secondary
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  secondaryCell: {
    width: '50%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryCellBorderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // Section
  sectionTitle: {
    marginBottom: Spacing.sm,
  },

  // Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
