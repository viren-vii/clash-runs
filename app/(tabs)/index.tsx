import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTracking } from '@/lib/tracking/tracking-context';
import { getAllSessions } from '@/lib/database/sessions-repository';
import { getRoutePoints } from '@/lib/database/route-repository';
import { RouteMapStatic } from '@/components/tracking/route-map-static';
import { StatsDisplay } from '@/components/tracking/stats-display';
import { ThemedText } from '@/components/themed-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatBlock } from '@/components/ui/stat-block';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ActivityChip } from '@/components/ui/activity-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { AmbientBackdrop } from '@/components/ui/ambient-backdrop';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/lib/settings/settings-context';
import {
  calculatePace,
  formatDistance,
  formatElapsedTime,
  formatPace,
  getPaceUnit,
} from '@/lib/tracking/distance-calculator';
import {
  getActivityColors,
  PageInsets,
  Radii,
  Spacing,
  StatusColors,
} from '@/constants/theme';
import { ACTIVITY_LABELS } from '@/constants/activity';
import type { Session, RoutePoint } from '@/lib/types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getBarColor(
  hasData: boolean,
  isSelected: boolean,
  isToday: boolean,
  inactiveColor: string,
  accent: string,
): string {
  if (hasData) {
    return isSelected || isToday ? accent : `${accent}88`;
  }
  return isSelected ? `${accent}55` : inactiveColor;
}

/** Convert JS getDay() (0=Sun) to Mon=0 index. */
function getDayIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

/** Get the Monday 00:00 of the week containing `date`. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const diff = getDayIndex(d);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useTracking();
  const bgColor = useThemeColor({}, 'surface');
  const chartInactive = useThemeColor({}, 'surfaceContainerHighest');
  const scheme = useColorScheme() ?? 'dark';
  const activityColors = getActivityColors(scheme);
  const chartAccent = activityColors.running;
  const { unitSystem } = useSettings();
  const paceUnit = getPaceUnit(unitSystem);

  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [lastRoutePoints, setLastRoutePoints] = useState<RoutePoint[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Pulse animation for start button — the "Electric Lime" as light source
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

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const thisWeekSessions = useMemo(
    () => allSessions.filter((s) => s.startTime >= weekStart.getTime()),
    [allSessions, weekStart],
  );

  const { weeklyDistances, weeklyTimes, weeklyCounts } = useMemo(() => {
    const distances = new Array(7).fill(0);
    const times = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    for (const s of thisWeekSessions) {
      const dayIdx = getDayIndex(new Date(s.startTime));
      distances[dayIdx] += s.totalDistance;
      times[dayIdx] += s.elapsedTime;
      counts[dayIdx] += 1;
    }
    return {
      weeklyDistances: distances as number[],
      weeklyTimes: times as number[],
      weeklyCounts: counts as number[],
    };
  }, [thisWeekSessions]);

  const maxBar = Math.max(...weeklyDistances, 1);

  const weekTotalDistance = thisWeekSessions.reduce(
    (sum, s) => sum + s.totalDistance,
    0,
  );
  const weekTotalTime = thisWeekSessions.reduce(
    (sum, s) => sum + s.elapsedTime,
    0,
  );

  const summaryActivities =
    selectedDay !== null ? weeklyCounts[selectedDay] : thisWeekSessions.length;
  const summaryDistance =
    selectedDay !== null ? weeklyDistances[selectedDay] : weekTotalDistance;
  const summaryTime =
    selectedDay !== null ? weeklyTimes[selectedDay] : weekTotalTime;

  const lastSession = allSessions.length > 0 ? allSessions[0] : null;
  const lastPace = lastSession
    ? calculatePace(lastSession.totalDistance, lastSession.elapsedTime)
    : null;

  const isActive = state.status === 'active' || state.status === 'paused';
  const todayIdx = getDayIndex(new Date());

  return (
    <View style={[styles.outerContainer, { backgroundColor: bgColor }]}>
      {/* Ambient light source — sits above the flat bg, below the cards.
          Shifts to a more intense breath when a session is live. */}
      <AmbientBackdrop variant={isActive ? 'active' : 'idle'} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText variant="displaySm" color="onSurface" style={styles.title}>
          Clash Runs
        </ThemedText>

        {/* Active session banner — pulses when live */}
        {isActive && (
          <Pressable
            onPress={() => router.push('/tracking/active')}
            accessibilityRole="button"
            accessibilityLabel={`${state.status === 'active' ? 'Tracking in progress' : 'Paused'}. Tap to return`}
          >
            <SurfaceCard
              tier={state.status === 'active' ? 'surfaceContainerLow' : 'surfaceVariant'}
              pulse={state.status === 'active'}
              ambient={state.status === 'active'}
              radius="xl"
              padding={Spacing.lg}
            >
              <View style={styles.bannerRow}>
                <View
                  style={[
                    styles.liveDot,
                    {
                      backgroundColor:
                        state.status === 'active'
                          ? StatusColors.active
                          : StatusColors.paused,
                    },
                  ]}
                />
                <ThemedText variant="titleMd" color="onSurface">
                  {state.status === 'active'
                    ? 'Tracking in progress'
                    : 'Paused'}
                </ThemedText>
              </View>
              <StatsDisplay
                elapsedTime={state.elapsedTime}
                totalDistance={state.totalDistance}
                currentPace={state.currentPace}
                compact
              />
              <ThemedText
                variant="labelSm"
                color="onSurfaceVariant"
                style={styles.bannerHint}
              >
                Tap to return
              </ThemedText>
            </SurfaceCard>
          </Pressable>
        )}

        {/* Weekly bar chart */}
        <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
          <View style={styles.chartHeader}>
            {selectedDay !== null ? (
              <Pressable
                onPress={() => setSelectedDay(null)}
                style={styles.backButton}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Back to week overview"
              >
                <Icon name="chevronLeft" size={20} color={chartAccent} />
                <ThemedText
                  variant="titleMd"
                  style={{ color: chartAccent }}
                >
                  Week
                </ThemedText>
              </Pressable>
            ) : (
              <ThemedText variant="titleMd" color="onSurface">
                This Week
              </ThemedText>
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
                          backgroundColor: getBarColor(
                            hasData,
                            isSelected,
                            isToday,
                            chartInactive,
                            chartAccent,
                          ),
                        },
                      ]}
                    />
                  </View>
                  <ThemedText
                    variant="labelSm"
                    color={
                      isSelected
                        ? 'primary'
                        : isToday
                        ? 'onSurface'
                        : 'onSurfaceDim'
                    }
                    style={[
                      styles.dayLabel,
                      isSelected ? { color: chartAccent } : undefined,
                    ]}
                  >
                    {DAY_LABELS[i]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Summary strip — nested higher tier (tonal layering, no border) */}
          <SurfaceCard
            tier="surfaceContainer"
            radius="md"
            padding={Spacing.md}
            style={styles.weekSummary}
          >
            <StatBlock
              size="sm"
              align="left"
              value={String(summaryActivities)}
              label={summaryActivities === 1 ? 'Activity' : 'Activities'}
            />
            <StatBlock
              size="sm"
              align="center"
              value={formatDistance(summaryDistance, unitSystem)}
              label="Distance"
              valueColor="primary"
            />
            <StatBlock
              size="sm"
              align="right"
              value={formatElapsedTime(summaryTime)}
              label="Time"
            />
          </SurfaceCard>
        </SurfaceCard>

        {/* Last Activity */}
        {lastSession ? (
          <Pressable
            onPress={() => router.push(`/session/${lastSession.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Last activity: ${ACTIVITY_LABELS[lastSession.activityType] ?? 'Workout'}`}
          >
            <SurfaceCard
              tier="surfaceContainerLow"
              radius="xl"
              padding={Spacing.lg}
            >
              <View style={styles.lastHeader}>
                <ThemedText variant="titleMd" color="onSurface">
                  Last Activity
                </ThemedText>
                <ActivityChip
                  type={
                    (lastSession.activityType as
                      | 'run'
                      | 'walk'
                      | 'cycle') ?? 'unknown'
                  }
                  label={
                    ACTIVITY_LABELS[lastSession.activityType] ?? 'Workout'
                  }
                  size="sm"
                />
              </View>

              <View style={styles.lastMapWrapper}>
                <RouteMapStatic routePoints={lastRoutePoints} height={160} />
              </View>

              <View style={styles.lastStats}>
                <StatBlock
                  size="sm"
                  align="left"
                  value={formatDistance(lastSession.totalDistance, unitSystem)}
                  label="Distance"
                  valueColor="primary"
                />
                <StatBlock
                  size="sm"
                  align="center"
                  value={formatElapsedTime(lastSession.elapsedTime)}
                  label="Time"
                />
                <StatBlock
                  size="sm"
                  align="right"
                  value={`${formatPace(lastPace, unitSystem)} ${paceUnit}`}
                  label="Pace"
                />
              </View>

              <ThemedText
                variant="labelMd"
                color="onSurfaceDim"
                style={styles.lastDate}
              >
                {new Date(lastSession.startTime).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </ThemedText>
            </SurfaceCard>
          </Pressable>
        ) : (
          !isActive && (
            <SurfaceCard
              tier="surfaceContainerLow"
              radius="xl"
              padding={Spacing.lg}
            >
              <EmptyState
                icon="run"
                title="Ready to go?"
                description="Start your first activity and your dashboard will come to life."
              />
            </SurfaceCard>
          )
        )}
      </ScrollView>

      {/* Floating start CTA */}
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
          <PrimaryButton
            label="Start Activity"
            ambient
            onPress={() => router.push('/tracking/pre-start')}
            accessibilityLabel="Start a new activity"
          />
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
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    paddingBottom: 96,
    gap: Spacing.lg,
  },
  title: {
    letterSpacing: -0.72, // -2% of 36
  },

  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
  },
  bannerHint: {
    marginTop: Spacing.sm,
    letterSpacing: 0.8,
  },

  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginTop: Spacing.lg,
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
    borderRadius: 4,
  },
  dayLabel: {
    marginTop: 6,
    textTransform: 'uppercase',
  },

  weekSummary: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  lastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  lastMapWrapper: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  lastStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
  },
  lastDate: {
    marginTop: Spacing.md,
  },

  stickyButton: {
    position: 'absolute',
    left: PageInsets.left,
    right: PageInsets.right,
  },
});
