import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteMapStatic } from '@/components/tracking/route-map-static';
import { StatsDisplay } from '@/components/tracking/stats-display';
import { SegmentTimeline } from '@/components/sessions/segment-timeline';
import { getSession } from '@/lib/database/sessions-repository';
import { getRoutePoints } from '@/lib/database/route-repository';
import { getSegments } from '@/lib/database/segments-repository';
import { deleteSession } from '@/lib/database/sessions-repository';
import { calculatePace } from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ActivityColors, StatusColors } from '@/constants/theme';
import type { Session, RoutePoint, ActivitySegment } from '@/lib/types';

export default function SummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');

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
        <Text style={[styles.loading, { color: subtleColor }]}>
          Loading...
        </Text>
      </View>
    );
  }

  const pace = calculatePace(session.totalDistance, session.elapsedTime);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: textColor }]}>Activity Summary</Text>

      <RouteMapStatic routePoints={routePoints} height={250} />

      <StatsDisplay
        elapsedTime={session.elapsedTime}
        totalDistance={session.totalDistance}
        currentPace={pace}
      />

      {segments.length > 0 && (
        <SegmentTimeline
          segments={segments}
          totalDuration={session.elapsedTime}
        />
      )}

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={[styles.metaLabel, { color: subtleColor }]}>
          Started:{' '}
          <Text style={{ color: textColor }}>
            {new Date(session.startTime).toLocaleString()}
          </Text>
        </Text>
        {session.endTime && (
          <Text style={[styles.metaLabel, { color: subtleColor }]}>
            Ended:{' '}
            <Text style={{ color: textColor }}>
              {new Date(session.endTime).toLocaleString()}
            </Text>
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={styles.saveButton}
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Save activity and return home"
        >
          <Text style={styles.saveButtonText}>Done</Text>
        </Pressable>
        <Pressable
          style={styles.discardButton}
          onPress={handleDiscard}
          accessibilityRole="button"
          accessibilityLabel="Discard this activity"
        >
          <Text style={styles.discardButtonText}>Discard</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },
  loading: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  metadata: {
    paddingVertical: 16,
    gap: 4,
  },
  metaLabel: {
    fontSize: 13,
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: ActivityColors.running,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  discardButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  discardButtonText: {
    color: StatusColors.active,
    fontSize: 16,
    fontWeight: '600',
  },
});
