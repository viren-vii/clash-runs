import React from 'react';
import { View, type ViewProps } from 'react-native';

import { type ColorToken } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type SurfaceTier =
  | 'surface'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'surfaceVariant';

export type ThemedViewProps = ViewProps & {
  /** Surface tier for tonal layering. Defaults to the page `surface`. */
  tier?: SurfaceTier;
  /** Override any color token (e.g. for error panels). */
  color?: ColorToken;
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  tier = 'surface',
  color,
  lightColor,
  darkColor,
  style,
  ...rest
}: ThemedViewProps) {
  const token: ColorToken = color ?? tier;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, token);
  return <View style={[{ backgroundColor }, style]} {...rest} />;
}
