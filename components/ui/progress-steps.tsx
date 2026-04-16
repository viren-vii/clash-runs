import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export type ProgressStepsProps = {
  total: number;
  current: number;
  style?: ViewStyle;
};

/**
 * Horizontal stepper track. Each segment is a full-radius pill that fills with
 * `primary` as the user advances. Keeps onboarding + multi-step flows on one
 * canonical component.
 */
export function ProgressSteps({
  total,
  current,
  style,
}: ProgressStepsProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const inactive = useThemeColor({}, 'surfaceContainerHigh');

  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: current + 1, min: 1, max: total }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i <= current ? palette.primary : inactive },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  dot: {
    width: 32,
    height: 4,
    borderRadius: Radii.full,
  },
});
