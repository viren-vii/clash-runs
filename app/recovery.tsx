import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sessionManager } from '@/lib/tracking/session-manager';
import { useTracking } from '@/lib/tracking/tracking-context';
import { formatElapsedTime, formatDistance } from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ActivityColors, StatusColors } from '@/constants/theme';
import type { Session } from '@/lib/types';

export default function RecoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { discardSession } = useTracking();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');

  const [orphanedSession, setOrphanedSession] = useState<Session | null>(null);

  useEffect(() => {
    sessionManager.recoverSession().then(setOrphanedSession);
  }, []);

  const handleResume = () => {
    router.replace('/tracking/active');
  };

  const handleDiscard = async () => {
    await discardSession();
    router.replace('/(tabs)');
  };

  if (!orphanedSession) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={[styles.noSession, { color: subtleColor }]}>
          No session to recover.
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: ActivityColors.running }]}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, paddingTop: insets.top + 20 },
      ]}
    >
      <Text style={[styles.title, { color: textColor }]}>
        Recover Activity?
      </Text>
      <Text style={[styles.subtitle, { color: subtleColor }]}>
        An unfinished activity was found from a previous session.
      </Text>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardLabel, { color: subtleColor }]}>
          Started
        </Text>
        <Text style={[styles.cardValue, { color: textColor }]}>
          {new Date(orphanedSession.startTime).toLocaleString()}
        </Text>

        <Text style={[styles.cardLabel, { color: subtleColor, marginTop: 12 }]}>
          Duration before interruption
        </Text>
        <Text style={[styles.cardValue, { color: textColor }]}>
          {formatElapsedTime(orphanedSession.elapsedTime)}
        </Text>

        <Text style={[styles.cardLabel, { color: subtleColor, marginTop: 12 }]}>
          Distance recorded
        </Text>
        <Text style={[styles.cardValue, { color: textColor }]}>
          {formatDistance(orphanedSession.totalDistance)}
        </Text>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.resumeButton} onPress={handleResume}>
          <Text style={styles.resumeButtonText}>Resume Activity</Text>
        </Pressable>
        <Pressable style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardButtonText}>Discard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  noSession: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  link: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  actions: {
    marginTop: 'auto',
    gap: 12,
  },
  resumeButton: {
    backgroundColor: ActivityColors.running,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resumeButtonText: {
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
