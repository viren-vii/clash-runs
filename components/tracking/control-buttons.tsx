import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Radii, Spacing } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ControlButtonsProps {
  status: 'idle' | 'active' | 'paused';
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export function ControlButtons({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
}: ControlButtonsProps) {
  const outline = useThemeColor({}, 'outline');
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const handle = (fn?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)?.catch(() => {});
    fn?.();
  };

  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <PrimaryButton
          label="START"
          onPress={() => handle(onStart)}
          size="lg"
          accessibilityLabel="Start activity"
        />
      </View>
    );
  }

  return (
    <View style={styles.rowContainer}>
      <Pressable
        onPress={() => handle(onStop)}
        onLongPress={() => handle(onStop)}
        style={({ pressed }) => [
          styles.stopButton,
          { backgroundColor: palette.error },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Stop activity"
      >
        <ThemedText
          variant="labelLg"
          style={[styles.stopLabel, { color: palette.onError }]}
        >
          STOP
        </ThemedText>
      </Pressable>

      {status === 'active' ? (
        <Pressable
          onPress={() => handle(onPause)}
          style={({ pressed }) => [
            styles.pauseButton,
            { borderColor: `${outline}55` },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Pause activity"
        >
          <ThemedText variant="labelLg" color="onSurface" style={styles.pauseLabel}>
            PAUSE
          </ThemedText>
        </Pressable>
      ) : (
        <PrimaryButton
          label="RESUME"
          onPress={() => handle(onResume)}
          size="lg"
          style={styles.resumeFlex}
          accessibilityLabel="Resume activity"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stopButton: {
    width: 68,
    height: 60,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopLabel: {
    letterSpacing: 1,
  },
  pauseButton: {
    flex: 1,
    height: 60,
    borderRadius: Radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseLabel: {
    letterSpacing: 1,
  },
  resumeFlex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
