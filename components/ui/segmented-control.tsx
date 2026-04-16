import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Radii, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Describes what the segments control, for accessibility. e.g. "units". */
  labelRole?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

/**
 * Full-radius pill segmented control. Active segment fills with `primary`
 * (Electric Lime) to read as the "selection light source" against a
 * `surfaceContainerHigh` track.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelRole,
  size = 'md',
  style,
}: SegmentedControlProps<T>) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const py = size === 'sm' ? Spacing.sm : Spacing.md;

  return (
    <View style={[styles.root, style]}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              Haptics.selectionAsync()?.catch(() => {});
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.segment,
              {
                paddingVertical: py,
                backgroundColor: isActive
                  ? palette.primary
                  : palette.surfaceContainerHigh,
              },
              pressed && !isActive && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              labelRole ? `${option.label} ${labelRole}` : option.label
            }
            accessibilityState={{ selected: isActive }}
          >
            <ThemedText
              variant={size === 'sm' ? 'labelMd' : 'labelLg'}
              style={{
                color: isActive ? palette.onPrimary : palette.onSurface,
              }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});
