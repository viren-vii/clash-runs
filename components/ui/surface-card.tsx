import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { Elevation, Radii, type ColorToken } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { SurfaceTier } from '@/components/themed-view';

export type SurfaceCardProps = ViewProps & {
  /** Surface tier. Defaults to `surfaceContainerLow` (the canonical card). */
  tier?: SurfaceTier;
  /** Pulse ring in `primary` at 40% opacity — Live-Stat Card "active" state. */
  pulse?: boolean;
  radius?: keyof typeof Radii;
  padding?: number;
  /** Use `outlineVariant` ghost border at 15% opacity — use sparingly. */
  ghostBorder?: boolean;
  /** Apply the ambient 32px-blur glow (for the live-stat card / hero CTA). */
  ambient?: boolean;
  style?: ViewStyle;
};

/**
 * Primary content card. Tonal layering only — NO 1px solid sectioning borders.
 * Place a `surfaceContainerLow` card on a `surface` background for depth, and
 * nest a `surfaceContainerHigh` child for a second tier if needed.
 */
export function SurfaceCard({
  tier = 'surfaceContainerLow',
  pulse = false,
  ghostBorder = false,
  ambient = false,
  radius = 'lg',
  padding = 16,
  style,
  children,
  ...rest
}: SurfaceCardProps) {
  const bg = useThemeColor({}, tier as ColorToken);
  const primary = useThemeColor({}, 'primary');
  const outlineVariant = useThemeColor({}, 'outlineVariant');

  // Ambient glow uses primary as the light-source tint when pulsing, otherwise
  // falls back to the neutral white glow in Elevation.ambient.
  const ambientStyle = ambient
    ? {
        ...Elevation.ambient,
        shadowColor: pulse ? primary : Elevation.ambient.shadowColor,
      }
    : null;

  const borderColor = pulse
    ? `${primary}66` // 40% lime pulse
    : ghostBorder
    ? `${outlineVariant}26` // ~15% ghost
    : 'transparent';

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: bg,
          borderRadius: Radii[radius],
          padding,
          borderColor,
          borderWidth: pulse ? 1.5 : ghostBorder ? StyleSheet.hairlineWidth : 0,
        },
        ambientStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
});
