import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracking } from '@/lib/tracking/tracking-context';
import { getAllSessions } from '@/lib/database/sessions-repository';
import { getRoutePoints } from '@/lib/database/route-repository';
import { RouteMapStatic } from '@/components/tracking/route-map-static';
import { StatsDisplay } from '@/components/tracking/stats-display';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/lib/settings/settings-context';
import {
  formatDistance,
  formatElapsedTime,
  formatPace,
  getPaceUnit,
} from '@/lib/tracking/distance-calculator';
import { StatusColors, ActivityColors } from '@/constants/theme';
import type { Session, RoutePoint } from '@/lib/types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

/** Get the Monday 00:00 of the week containing `date`. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // shift so Mon=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { state } = useTracking();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const { unitSystem } = useSettings();
  const paceUnit = getPaceUnit(unitSystem);

  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [lastRoutePoints, setLastRoutePoints] = useState<RoutePoint[]>([]);
  // Selected day index for interactive chart (null = week overview)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Pulse animation for start button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const loadData = useCallback(async () => {
    try {
      const sessions = await getAllSessions();
      setAllSessions(sessions);
      if (sessions.length > 0) {
        const rp = await getRoutePoints(sessions[0].id);
        setLastRoutePoints(rp);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, state.status]);

  // ── Derived data ──

  const weekStart = useMemo(() => getWeekStart(new Date()), []);

  const thisWeekSessions = useMemo(
    () => allSessions.filter((s) => s.startTime >= weekStart.getTime()),
    [allSessions, weekStart],
  );

  const lastWeekStart = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    return d;
  }, [weekStart]);

  const lastWeekSessions = useMemo(
    () =>
      allSessions.filter(
        (s) =>
          s.startTime >= lastWeekStart.getTime() &&
          s.startTime < weekStart.getTime(),
      ),
    [allSessions, lastWeekStart, weekStart],
  );

  // Weekly bar chart data (Mon–Sun) – distances, times, counts per day
  const weeklyDistances = useMemo(() => {
    const bars = new Array(7).fill(0);
    for (const s of thisWeekSessions) {
      const d = new Date(s.startTime);
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      bars[dayIdx] += s.totalDistance;
    }
    return bars as number[];
  }, [thisWeekSessions]);

  const weeklyTimes = useMemo(() => {
    const bars = new Array(7).fill(0);
    for (const s of thisWeekSessions) {
      const d = new Date(s.startTime);
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      bars[dayIdx] += s.elapsedTime;
    }
    return bars as number[];
  }, [thisWeekSessions]);

  const weeklyCounts = useMemo(() => {
    const bars = new Array(7).fill(0);
    for (const s of thisWeekSessions) {
      const d = new Date(s.startTime);
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      bars[dayIdx] += 1;
    }
    return bars as number[];
  }, [thisWeekSessions]);

  const maxBar = Math.max(...weeklyDistances, 1); // avoid div-by-zero

  const weekTotalDistance = thisWeekSessions.reduce(
    (sum, s) => sum + s.totalDistance,
    0,
  );
  const weekTotalTime = thisWeekSessions.reduce(
    (sum, s) => sum + s.elapsedTime,
    0,
  );
  const lastWeekTotalDistance = lastWeekSessions.reduce(
    (sum, s) => sum + s.totalDistance,
    0,
  );

  // Summary values – either for whole week or selected day
  const FULL_DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const summaryActivities = selectedDay !== null ? weeklyCounts[selectedDay] : thisWeekSessions.length;
  const summaryDistance = selectedDay !== null ? weeklyDistances[selectedDay] : weekTotalDistance;
  const summaryTime = selectedDay !== null ? weeklyTimes[selectedDay] : weekTotalTime;

  // (comparison text removed to avoid layout shift on bar tap)

  const lastSession = allSessions.length > 0 ? allSessions[0] : null;
  const lastPace =
    lastSession && lastSession.totalDistance > 0 && lastSession.elapsedTime > 0
      ? lastSession.elapsedTime / 60000 / (lastSession.totalDistance / 1000)
      : null;

  const isActive = state.status === 'active' || state.status === 'paused';
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <View style={[styles.outerContainer, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: textColor }]}>Clash Runs</Text>

        {/* Active session banner */}
        {isActive && (
          <Pressable
            style={[
              styles.activeBanner,
              {
                backgroundColor:
                  state.status === 'active'
                    ? StatusColors.active
                    : StatusColors.paused,
              },
            ]}
            onPress={() => router.push('/tracking/active')}
            accessibilityRole="button"
            accessibilityLabel={`${state.status === 'active' ? 'Tracking in progress' : 'Paused'}. Tap to return`}
          >
            <Text style={styles.bannerTitle}>
              {state.status === 'active' ? 'Tracking in progress' : 'Paused'}
            </Text>
            <StatsDisplay
              elapsedTime={state.elapsedTime}
              totalDistance={state.totalDistance}
              currentPace={state.currentPace}
              compact
              invertColors
            />
            <Text style={styles.bannerHint}>Tap to return</Text>
          </Pressable>
        )}

        {/* Weekly bar chart */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardColor,
              shadowColor: colorScheme === 'dark' ? '#000' : '#888',
            },
          ]}
        >
          {/* Header: "This Week" or day name with back arrow */}
          <View style={styles.chartHeader}>
            {selectedDay !== null ? (
              <Pressable
                onPress={() => setSelectedDay(null)}
                style={styles.backButton}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Back to week overview"
              >
                <Text style={[styles.backArrow, { color: ActivityColors.running }]}>
                  ‹
                </Text>
                <Text style={[styles.backText, { color: ActivityColors.running }]}>
                  Week
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.cardTitle, { color: textColor }]}>
                This Week
              </Text>
            )}
          </View>

          <View style={styles.chartContainer}>
            {weeklyDistances.map((dist, i) => {
              const heightPct = Math.max((dist / maxBar) * 100, 4);
              const isToday = i === todayIdx;
              const isSelected = i === selectedDay;
              const hasData = dist > 0;
              return (
                <Pressable
                  key={i}
                  style={styles.chartCol}
                  onPress={() => setSelectedDay(i === selectedDay ? null : i)}
                  accessibilityRole="button"
                  accessibilityLabel={`${DAY_LABELS[i]}: ${formatDistance(dist, unitSystem)}`}
                >
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: hasData
                            ? isSelected
                              ? ActivityColors.running
                              : isToday
                                ? ActivityColors.running
                                : `${ActivityColors.running}88`
                            : isSelected
                              ? `${ActivityColors.running}55`
                              : borderColor,
                          borderRadius: 4,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      {
                        color: isSelected
                          ? ActivityColors.running
                          : isToday
                            ? textColor
                            : subtleColor,
                        fontWeight: isSelected || isToday ? '700' : '400',
                      },
                    ]}
                  >
                    {DAY_LABELS[i]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Summary row – switches between week and selected day */}
          <View style={[styles.weekSummary, { borderTopColor: borderColor }]}>
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatValue, { color: textColor }]}>
                {summaryActivities}
              </Text>
              <Text style={[styles.weekStatLabel, { color: subtleColor }]}>
                {summaryActivities === 1 ? 'Activity' : 'Activities'}
              </Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatValue, { color: textColor }]}>
                {formatDistance(summaryDistance, unitSystem)}
              </Text>
              <Text style={[styles.weekStatLabel, { color: subtleColor }]}>
                Distance
              </Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatValue, { color: textColor }]}>
                {formatElapsedTime(summaryTime)}
              </Text>
              <Text style={[styles.weekStatLabel, { color: subtleColor }]}>
                Time
              </Text>
            </View>
          </View>

        </View>

        {/* Last Activity hero card */}
        {lastSession ? (
          <Pressable
            onPress={() => router.push(`/session/${lastSession.id}`)}
            style={[
              styles.card,
              {
                backgroundColor: cardColor,
                shadowColor: colorScheme === 'dark' ? '#000' : '#888',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Last activity: ${ACTIVITY_LABELS[lastSession.activityType] ?? 'Workout'}`}
          >
            <View style={styles.lastHeader}>
              <Text style={[styles.cardTitle, { color: textColor }]}>
                Last Activity
              </Text>
              <Text style={[styles.lastType, { color: subtleColor }]}>
                {ACTIVITY_EMOJI[lastSession.activityType] ?? '🏋️'}{' '}
                {ACTIVITY_LABELS[lastSession.activityType] ?? 'Workout'}
              </Text>
            </View>

            <View style={styles.lastMapWrapper}>
              <RouteMapStatic routePoints={lastRoutePoints} height={160} />
            </View>

            <View style={styles.lastStats}>
              <View style={styles.lastStat}>
                <Text style={[styles.lastStatValue, { color: textColor }]}>
                  {formatDistance(lastSession.totalDistance, unitSystem)}
                </Text>
                <Text style={[styles.lastStatLabel, { color: subtleColor }]}>
                  Distance
                </Text>
              </View>
              <View style={styles.lastStat}>
                <Text style={[styles.lastStatValue, { color: textColor }]}>
                  {formatElapsedTime(lastSession.elapsedTime)}
                </Text>
                <Text style={[styles.lastStatLabel, { color: subtleColor }]}>
                  Time
                </Text>
              </View>
              <View style={styles.lastStat}>
                <Text style={[styles.lastStatValue, { color: textColor }]}>
                  {formatPace(lastPace, unitSystem)} {paceUnit}
                </Text>
                <Text style={[styles.lastStatLabel, { color: subtleColor }]}>
                  Pace
                </Text>
              </View>
            </View>

            <Text style={[styles.lastDate, { color: subtleColor }]}>
              {new Date(lastSession.startTime).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </Pressable>
        ) : (
          !isActive && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardColor,
                  shadowColor: colorScheme === 'dark' ? '#000' : '#888',
                },
              ]}
            >
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏃</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>
                  Ready to go?
                </Text>
                <Text style={[styles.emptyText, { color: subtleColor }]}>
                  Start your first activity and your dashboard will come to
                  life.
                </Text>
              </View>
            </View>
          )
        )}
      </ScrollView>

      {/* Floating start button with breathing pulse */}
      {!isActive && (
        <Animated.View
          style={[
            styles.stickyButton,
            {
              bottom: insets.bottom - 8,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.stickyButtonInner,
              pressed && styles.stickyButtonPressed,
            ]}
            onPress={() => router.push('/tracking/pre-start')}
            accessibilityRole="button"
            accessibilityLabel="Start a new activity"
          >
            <Text style={styles.stickyButtonText}>Start Activity</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 88,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },

  // Active banner
  activeBanner: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  bannerHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 8,
  },

  // Card
  card: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Chart header – fixed height to prevent CLS on toggle
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
    marginRight: 2,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Weekly chart
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 16,
    gap: 6,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Week summary
  weekSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  weekStat: {
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  weekStatLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Last activity hero
  lastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastType: {
    fontSize: 14,
  },
  lastMapWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: -4,
  },
  lastStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  lastStat: {
    alignItems: 'center',
  },
  lastStatValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lastStatLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastDate: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Sticky button
  stickyButton: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  stickyButtonInner: {
    backgroundColor: ActivityColors.running,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stickyButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  stickyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
