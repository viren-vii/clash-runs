import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Ambient "light source" backdrop. Two radial halos (top + bottom) in the
 * scheme's primary accent, very low opacity peak, slow opacity breath. Sits
 * between the flat surface background and the content layer — cards scroll
 * past it so the light stays anchored to the viewport, which is what makes
 * the instrument-panel aesthetic read as illuminated rather than painted.
 *
 * Respects the "use glow SPARINGLY" design rule: peaks at 18% on dark / 8%
 * on light — a wash, not a spotlight.
 */
export type AmbientBackdropVariant = 'idle' | 'active';

export function AmbientBackdrop({
  variant = 'idle',
  style,
}: {
  variant?: AmbientBackdropVariant;
  style?: ViewStyle;
}) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  // Opacity breath — slow inhale/exhale so the glow reads as "alive" without
  // visibly animating frame-to-frame.
  const breath = useSharedValue(0.78);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.0, {
        duration: variant === 'active' ? 1800 : 3500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [breath, variant]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  // Peak opacities: bright Electric Lime on dark is vivid at low alpha; deep
  // olive lime on light needs even less to avoid muddying the canvas.
  const topPeak =
    variant === 'active'
      ? scheme === 'light'
        ? 0.18
        : 0.28
      : scheme === 'light'
      ? 0.08
      : 0.18;
  const bottomPeak = variant === 'active' ? topPeak * 0.6 : topPeak * 0.55;

  const primary = palette.primary;

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, animatedStyle, style]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          {/* Top halo — positioned above the viewport so only the bottom
              half of the falloff is visible ("sun over horizon") */}
          <RadialGradient
            id="topGlow"
            cx="50%"
            cy="-15%"
            rx="85%"
            ry="50%"
            fx="50%"
            fy="-15%"
          >
            <Stop offset="0%" stopColor={primary} stopOpacity={topPeak} />
            <Stop offset="100%" stopColor={primary} stopOpacity={0} />
          </RadialGradient>

          {/* Bottom uplight — smaller, anchored where the Start CTA lives */}
          <RadialGradient
            id="bottomGlow"
            cx="50%"
            cy="115%"
            rx="70%"
            ry="35%"
            fx="50%"
            fy="115%"
          >
            <Stop offset="0%" stopColor={primary} stopOpacity={bottomPeak} />
            <Stop offset="100%" stopColor={primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="url(#topGlow)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomGlow)" />
      </Svg>
    </Animated.View>
  );
}

/** Back-compat non-animated variant for test snapshots. */
export function AmbientBackdropStatic({ style }: { style?: ViewStyle }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}
