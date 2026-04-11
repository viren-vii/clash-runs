import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
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
import { ActivityColors, StatusColors } from '@/constants/theme';
import { ACTIVITY_EMOJI, ACTIVITY_LABELS } from '@/constants/activity';
import type { Session, RoutePoint, ActivitySegment } from '@/lib/types';

export default function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
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

  if (!session) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <Text style={[styles.loadingText, { color: subtleColor }]}>
          Loading activity...
        </Text>
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

  // Calculate average speed in km/h or mph
  const avgSpeedFormatted =
    speed !== null
      ? unitSystem === 'imperial'
        ? `${((speed * 3600) / 1609.344).toFixed(1)} mph`
        : `${((speed * 3600) / 1000).toFixed(1)} km/h`
      : '--';

  // Estimated calories (MET-based: walk ~3.5, run ~9.8, cycle ~7.5)
  const MET_VALUES: Record<string, number> = { walk: 3.5, run: 9.8, cycle: 7.5, mixed: 5.0 };
  const met = MET_VALUES[session.activityType] ?? 5.0;
  const durationHrs = session.elapsedTime / 3_600_000;
  // Uses the weight stored at session time; formula: calories = MET × weight × duration
  const estimatedCalories = Math.round(met * session.userWeight * durationHrs);

  // Elevation stats from route points
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: Activity type + Date */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.activityEmoji}>
            {ACTIVITY_EMOJI[session.activityType] ?? '🏋️'}
          </Text>
          <View style={styles.headerText}>
            <Text style={[styles.activityLabel, { color: textColor }]}>
              {ACTIVITY_LABELS[session.activityType] ?? 'Workout'}
            </Text>
            <Text style={[styles.dateText, { color: subtleColor }]}>
              {dateStr}
            </Text>
          </View>
        </View>
      </View>

      {/* Route Map — full-bleed with rounded corners */}
      <View
        style={[
          styles.mapCard,
          {
            backgroundColor: cardColor,
            shadowColor: colorScheme === 'dark' ? '#000' : '#888',
          },
        ]}
      >
        <RouteMapStatic routePoints={routePoints} height={260} />
      </View>

      {/* Primary Stats — large hero numbers */}
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: cardColor,
            shadowColor: colorScheme === 'dark' ? '#000' : '#888',
          },
        ]}
      >
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroValue, { color: textColor }]}>
              {formatDistance(session.totalDistance, unitSystem)}
            </Text>
            <Text style={[styles.heroLabel, { color: subtleColor }]}>
              Distance
            </Text>
          </View>
          <View
            style={[styles.heroDivider, { backgroundColor: borderColor }]}
          />
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroValue, { color: textColor }]}>
              {formatElapsedTime(session.elapsedTime)}
            </Text>
            <Text style={[styles.heroLabel, { color: subtleColor }]}>
              Duration
            </Text>
          </View>
        </View>
      </View>

      {/* Secondary Stats — 2x2 grid */}
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: cardColor,
            shadowColor: colorScheme === 'dark' ? '#000' : '#888',
          },
        ]}
      >
        <View style={styles.secondaryGrid}>
          <View style={[styles.secondaryStat, { borderColor }]}>
            <Text style={[styles.secondaryValue, { color: textColor }]}>
              {formatPace(pace, unitSystem)}
            </Text>
            <Text style={[styles.secondaryLabel, { color: subtleColor }]}>
              Avg Pace ({paceUnit.replace('/', '')})
            </Text>
          </View>
          <View style={[styles.secondaryStat, { borderColor }]}>
            <Text style={[styles.secondaryValue, { color: textColor }]}>
              {avgSpeedFormatted}
            </Text>
            <Text style={[styles.secondaryLabel, { color: subtleColor }]}>
              Avg Speed
            </Text>
          </View>
          <View style={[styles.secondaryStat, { borderColor }]}>
            <Text style={[styles.secondaryValue, { color: textColor }]}>
              {estimatedCalories > 0 ? `${estimatedCalories} kcal` : '--'}
            </Text>
            <Text style={[styles.secondaryLabel, { color: subtleColor }]}>
              Calories (est.)
            </Text>
          </View>
          <View style={[styles.secondaryStat, { borderColor }]}>
            <Text style={[styles.secondaryValue, { color: textColor }]}>
              {elevationGain !== null
                ? unitSystem === 'imperial'
                  ? `${Math.round(elevationGain * 3.28084)} ft`
                  : `${Math.round(elevationGain)} m`
                : '--'}
            </Text>
            <Text style={[styles.secondaryLabel, { color: subtleColor }]}>
              Elev. Gain
            </Text>
          </View>
        </View>
      </View>

      {/* Segment Timeline */}
      {segments.length > 0 && (
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: cardColor,
              shadowColor: colorScheme === 'dark' ? '#000' : '#888',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Activity Segments
          </Text>
          <SegmentTimeline
            segments={segments}
            totalDuration={session.elapsedTime}
          />
        </View>
      )}

      {/* Time Details Card */}
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: cardColor,
            shadowColor: colorScheme === 'dark' ? '#000' : '#888',
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Details
        </Text>
        <View style={styles.detailRows}>
          <View style={[styles.detailRow, { borderColor }]}>
            <Text style={[styles.detailLabel, { color: subtleColor }]}>
              Started
            </Text>
            <Text style={[styles.detailValue, { color: textColor }]}>
              {startTimeStr}
            </Text>
          </View>
          {endTimeStr && (
            <View style={[styles.detailRow, { borderColor }]}>
              <Text style={[styles.detailLabel, { color: subtleColor }]}>
                Finished
              </Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {endTimeStr}
              </Text>
            </View>
          )}
          {session.endTime && (
            <View style={[styles.detailRow, { borderColor }]}>
              <Text style={[styles.detailLabel, { color: subtleColor }]}>
                Total Time
              </Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {formatElapsedTime(session.endTime - session.startTime)}
              </Text>
            </View>
          )}
          {session.endTime &&
            session.elapsedTime <
              session.endTime - session.startTime - 1000 && (
              <View style={[styles.detailRow, { borderColor }]}>
                <Text style={[styles.detailLabel, { color: subtleColor }]}>
                  Paused Time
                </Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {formatElapsedTime(
                    session.endTime -
                      session.startTime -
                      session.elapsedTime,
                  )}
                </Text>
              </View>
            )}
        </View>
      </View>

      {/* Delete Button */}
      <Pressable
        style={styles.deleteButton}
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete this activity"
      >
        <Text style={styles.deleteButtonText}>Delete Activity</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },

  // Header
  header: {
    marginBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  activityEmoji: {
    fontSize: 40,
  },
  headerText: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 26,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 14,
    marginTop: 2,
  },

  // Map
  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // Stats cards
  statsCard: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // Hero stats (distance + duration)
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroDivider: {
    width: 1,
    height: 48,
    marginHorizontal: 8,
  },

  // Secondary stats 2x2 grid
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  secondaryStat: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  secondaryValue: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  secondaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },

  // Detail rows
  detailRows: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Delete
  deleteButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: StatusColors.active,
    fontSize: 16,
    fontWeight: '600',
  },
});
