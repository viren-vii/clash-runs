import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radii } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: keyof typeof Radii;
  style?: ViewStyle;
};

/**
 * Tonal loading placeholder. Uses two surface tiers (`surfaceContainer` base
 * + `surfaceContainerHighest` highlight) animating at a slow 1.2s pulse so
 * the shimmer reads as "waiting", not "progress".
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'sm',
  style,
}: SkeletonProps) {
  const base = useThemeColor({}, 'surfaceContainer');
  const highlight = useThemeColor({}, 'surfaceContainerHighest');
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const backgroundColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [base, highlight],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor,
          borderRadius: Radii[radius],
        },
        style,
      ]}
    />
  );
}

/** Convenience row of stacked skeleton lines (for "card loading" states). */
export function SkeletonLines({
  count = 3,
  lineHeight = 14,
  gap = 8,
  widths,
}: {
  count?: number;
  lineHeight?: number;
  gap?: number;
  widths?: (number | `${number}%`)[];
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={widths?.[i] ?? (i === count - 1 ? '60%' : '100%')}
        />
      ))}
    </View>
  );
}

// Re-export to suppress unused-style-sheet lint warnings
const _styles = StyleSheet.create({ placeholder: { flex: 1 } });
export default _styles;
