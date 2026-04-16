import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Typography, type ColorToken } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type TypographyVariant = keyof typeof Typography;

export type ThemedTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
  lightColor?: string;
  darkColor?: string;
  /**
   * Force tabular (monospaced) figures. Automatically enabled for `metric*`
   * variants. Set to `true` for any other surface where numbers animate
   * (e.g. body-copy timers) so digits don't jitter.
   */
  tabular?: boolean;
};

/**
 * Themed text primitive for the Kinetic Lab system.
 *
 * Defaults: Inter body-md, `onSurface` color. Pass `variant` for display /
 * headline / title / label / metric scale. Metric variants already set
 * `fontVariant: ['tabular-nums']` — no need to pass `tabular` for them.
 */
export function ThemedText({
  variant = 'bodyMd',
  color = 'onSurface',
  lightColor,
  darkColor,
  tabular,
  style,
  ...rest
}: ThemedTextProps) {
  const resolvedColor = useThemeColor({ light: lightColor, dark: darkColor }, color);
  const baseStyle = Typography[variant] as TextStyle;

  return (
    <Text
      style={[
        baseStyle,
        { color: resolvedColor },
        tabular ? styles.tabular : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
