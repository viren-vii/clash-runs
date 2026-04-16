import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMapStatic } from '@/components/tracking/route-map-static';
import { StatsDisplay } from '@/components/tracking/stats-display';
import { SegmentTimeline } from '@/components/sessions/segment-timeline';
import { getSession, deleteSession } from '@/lib/database/sessions-repository';
import { getRoutePoints } from '@/lib/database/route-repository';
import { getSegments } from '@/lib/database/segments-repository';
import { calculatePace } from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/primary-button';
import { PageInsets, Radii, Spacing } from '@/constants/theme';
import type { Session, RoutePoint, ActivitySegment } from '@/lib/types';

export default function SummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const bgColor = useThemeColor({}, 'surface');

  const [session, setSession] = useState<Session | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [segments, setSegments] = useState<ActivitySegment[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    loadData(sessionId);
  }, [sessionId]);

  async function loadData(id: string) {
    const [s, rp, seg] = await Promise.all([
      getSession(id),
      getRoutePoints(id),
      getSegments(id),
    ]);
    setSession(s);
    setRoutePoints(rp);
    setSegments(seg);
  }

  const handleDiscard = () => {
    Alert.alert('Discard Activity', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          if (sessionId) {
            await deleteSession(sessionId);
          }
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ThemedText
          variant="bodyLg"
          color="onSurfaceVariant"
          style={styles.loading}
        >
          Loading...
        </ThemedText>
      </View>
    );
  }

  const pace = calculatePace(session.totalDistance, session.elapsedTime);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText
        variant="displaySm"
        color="onSurface"
        style={styles.title}
      >
        Activity Summary
      </ThemedText>

      <View style={styles.mapWrapper}>
        <RouteMapStatic routePoints={routePoints} height={250} />
      </View>

      <SurfaceCard
        tier="surfaceContainerLow"
        radius="xl"
        padding={Spacing.lg}
      >
        <StatsDisplay
          elapsedTime={session.elapsedTime}
          totalDistance={session.totalDistance}
          currentPace={pace}
        />
      </SurfaceCard>

      {segments.length > 0 && (
        <SurfaceCard
          tier="surfaceContainerLow"
          radius="xl"
          padding={Spacing.lg}
        >
          <ThemedText
            variant="titleMd"
            color="onSurface"
            style={styles.cardTitle}
          >
            Timeline
          </ThemedText>
          <SegmentTimeline
            segments={segments}
            totalDuration={session.elapsedTime}
          />
        </SurfaceCard>
      )}

      <SurfaceCard
        tier="surfaceContainerLow"
        radius="xl"
        padding={Spacing.lg}
      >
        <View style={styles.metaRow}>
          <ThemedText variant="labelMd" color="onSurfaceVariant">
            Started
          </ThemedText>
          <ThemedText variant="bodyMd" color="onSurface">
            {new Date(session.startTime).toLocaleString()}
          </ThemedText>
        </View>
        {session.endTime && (
          <View style={styles.metaRow}>
            <ThemedText variant="labelMd" color="onSurfaceVariant">
              Ended
            </ThemedText>
            <ThemedText variant="bodyMd" color="onSurface">
              {new Date(session.endTime).toLocaleString()}
            </ThemedText>
          </View>
        )}
      </SurfaceCard>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Done"
          size="lg"
          onPress={() => router.replace('/(tabs)')}
          accessibilityLabel="Save activity and return home"
        />
        <SecondaryButton
          label="Discard"
          size="md"
          destructive
          onPress={handleDiscard}
          accessibilityLabel="Discard this activity"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  title: {
    letterSpacing: -0.72,
    marginBottom: Spacing.sm,
  },
  mapWrapper: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  loading: {
    textAlign: 'center',
    marginTop: 100,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
