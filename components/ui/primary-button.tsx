import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Elevation, Radii, Typography } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Size = 'sm' | 'md' | 'lg';

export type PrimaryButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  /** Render the ambient "light source" glow (use for hero CTAs). */
  ambient?: boolean;
  /** Ghost-red destructive variant (delete/discard). */
  destructive?: boolean;
  style?: ViewStyle;
};

const HEIGHT: Record<Size, number> = { sm: 40, md: 52, lg: 60 };
const FONT: Record<Size, keyof typeof Typography> = {
  sm: 'labelLg',
  md: 'titleMd',
  lg: 'titleLg',
};

/**
 * Primary CTA. Electric Lime gradient (primaryDim → primary), xl squircle
 * radius, no drop shadow. Background feels like a "light source" illuminating
 * nearby dark surfaces.
 */
export function PrimaryButton({
  label,
  size = 'lg',
  disabled,
  loading,
  haptic = true,
  ambient = false,
  onPress,
  style,
  ...rest
}: PrimaryButtonProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  // Lime ambient halo — a 32px glow that makes the CTA read as the "light source".
  const ambientStyle = ambient
    ? { ...Elevation.ambient, shadowColor: palette.primary, shadowOpacity: 0.35 }
    : null;

  return (
    <Pressable
      onPress={(e) => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)?.catch(() => {});
        }
        onPress?.(e);
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.root,
        { height: HEIGHT[size] },
        ambientStyle,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      {...rest}
    >
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: palette.primary }]}
      />
      <ThemedText
        variant={FONT[size]}
        style={[styles.label, { color: palette.onPrimary }]}
      >
        {loading ? '…' : label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Ghost secondary — outline at 20% opacity, onSurface text. Sits cleanly next
 * to a primary CTA without competing for the light source.
 */
export function SecondaryButton({
  label,
  size = 'lg',
  disabled,
  onPress,
  haptic = true,
  destructive = false,
  style,
  ...rest
}: PrimaryButtonProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  // Destructive uses the scheme's error ink (deep crimson on light, coral on
  // dark) with a faint tinted fill + stronger border so the button reads as a
  // real target rather than a ghost — both themes get ≥4.5:1 text contrast.
  const borderColor = destructive ? `${palette.error}80` : `${palette.outline}33`;
  const backgroundColor = destructive ? `${palette.error}12` : 'transparent';
  const textColor = destructive ? palette.error : palette.onSurface;

  return (
    <Pressable
      onPress={(e) => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)?.catch(() => {});
        }
        onPress?.(e);
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.root,
        styles.ghost,
        { height: HEIGHT[size], borderColor, backgroundColor },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      <ThemedText variant={FONT[size]} style={[styles.label, { color: textColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ghost: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  label: {
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
