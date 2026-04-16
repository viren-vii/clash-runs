import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { getActivityColors, Radii } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { SessionActivityType } from '@/lib/types';

type ActivityKey = SessionActivityType | 'stationary' | 'unknown';

export type ActivityChipProps = {
  type: ActivityKey;
  label: string;
  /** Lucide icon name. Falls back to the canonical activity icon if omitted. */
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'picker';
  style?: ViewStyle;
};

const DEFAULT_ICON: Record<ActivityKey, IconName> = {
  walk: 'walk',
  run: 'run',
  cycle: 'cycle',
  mixed: 'mixed',
  stationary: 'unknown',
  unknown: 'unknown',
};

/**
 * Activity identifier chip. Full (9999px) radius to contrast against the
 * geometric cards. When `selected`, the activity color fills the chip; when
 * not, the color shows as a subtle ghost fill over the surface.
 */
export function ActivityChip({
  type,
  label,
  icon,
  selected = false,
  onPress,
  size = 'md',
  style,
}: ActivityChipProps) {
  const scheme = useColorScheme() ?? 'dark';
  const activityColors = getActivityColors(scheme);
  // Map session activity keys (run/walk/cycle) to the ActivityColors keys
  // (running/walking/cycling). Other keys (mixed/stationary/unknown) pass through.
  const COLOR_KEY_MAP: Record<string, keyof typeof activityColors> = {
    run: 'running',
    walk: 'walking',
    cycle: 'cycling',
  };
  const colorKey = (COLOR_KEY_MAP[type] ?? type) as keyof typeof activityColors;
  const accent = activityColors[colorKey] ?? activityColors.unknown;
  const resolvedIcon = icon ?? DEFAULT_ICON[type];
  const py = size === 'sm' ? 6 : size === 'picker' ? 18 : 10;
  const px = size === 'sm' ? 12 : size === 'picker' ? 20 : 16;
  const iconSize = size === 'sm' ? 14 : size === 'picker' ? 28 : 18;
  // Selected chip: accent fill. Text/icon inverse on the accent — always a
  // very-dark ink on dark's pastel accents, white on light's saturated deep
  // accents. Unselected: translucent ghost fill (higher-opacity tint on light
  // for a visible wash; 13% on dark to avoid a bright halo).
  const onAccent = scheme === 'light' ? '#ffffff' : '#0b0f00';
  const ghostBg = scheme === 'light' ? `${accent}1a` : `${accent}22`;
  const iconColor = selected ? onAccent : accent;

  const content = (
    <View
      style={[
        styles.root,
        size === 'picker' && styles.pickerRoot,
        {
          paddingVertical: py,
          paddingHorizontal: px,
          backgroundColor: selected ? accent : ghostBg,
        },
        style,
      ]}
    >
      <Icon name={resolvedIcon} size={iconSize} color={iconColor} />
      <ThemedText
        variant={size === 'sm' ? 'labelMd' : 'labelLg'}
        style={[styles.label, { color: selected ? onAccent : accent }]}
      >
        {label}
      </ThemedText>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync()?.catch(() => {});
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} activity`}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.full,
    alignSelf: 'auto',
  },
  pickerRoot: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 0.4,
  },
});
