import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sessionManager } from '@/lib/tracking/session-manager';
import { useTracking } from '@/lib/tracking/tracking-context';
import { useSettings } from '@/lib/settings/settings-context';
import {
  formatElapsedTime,
  formatDistance,
} from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatBlock } from '@/components/ui/stat-block';
import { PrimaryButton, SecondaryButton } from '@/components/ui/primary-button';
import { PageInsets, Spacing } from '@/constants/theme';
import type { Session } from '@/lib/types';

export default function RecoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { discardSession } = useTracking();
  const { unitSystem } = useSettings();
  const bgColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'primary');

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
      <View
        style={[
          styles.container,
          { backgroundColor: bgColor, paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <ThemedText
          variant="bodyLg"
          color="onSurfaceVariant"
          style={styles.noSession}
        >
          No session to recover.
        </ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText
            variant="labelLg"
            style={[styles.link, { color: tintColor }]}
          >
            Go Back
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, paddingTop: insets.top + Spacing.lg },
      ]}
    >
      <ThemedText variant="displaySm" color="onSurface" style={styles.title}>
        Recover Activity?
      </ThemedText>
      <ThemedText
        variant="bodyLg"
        color="onSurfaceVariant"
        style={styles.subtitle}
      >
        An unfinished activity was found from a previous session.
      </ThemedText>

      <SurfaceCard
        tier="surfaceContainerLow"
        radius="xl"
        padding={Spacing.lg}
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <ThemedText variant="labelMd" color="onSurfaceVariant">
            STARTED
          </ThemedText>
          <ThemedText variant="bodyMd" color="onSurface">
            {new Date(orphanedSession.startTime).toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.statsRow}>
          <StatBlock
            size="md"
            align="left"
            value={formatElapsedTime(orphanedSession.elapsedTime)}
            label="Duration"
          />
          <StatBlock
            size="md"
            align="right"
            value={formatDistance(orphanedSession.totalDistance, unitSystem)}
            label="Distance"
          />
        </View>
      </SurfaceCard>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Resume Activity"
          size="lg"
          onPress={handleResume}
          accessibilityLabel="Resume the orphaned activity"
        />
        <SecondaryButton
          label="Discard"
          size="md"
          destructive
          onPress={handleDiscard}
          accessibilityLabel="Discard the orphaned activity"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
  },
  title: {
    letterSpacing: -0.72,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  noSession: {
    textAlign: 'center',
    marginTop: 100,
  },
  link: {
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  card: {
    gap: Spacing.md,
  },
  cardRow: {
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  actions: {
    marginTop: 'auto',
    gap: Spacing.md,
  },
});
