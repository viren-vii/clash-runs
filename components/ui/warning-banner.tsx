import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Severity = 'info' | 'warning' | 'error';

export type WarningBannerProps = {
  severity?: Severity;
  title?: string;
  message: string;
  icon?: IconName;
  style?: ViewStyle;
};

// Scheme-aware severity accent. Pastel variants for dark surfaces, deeper
// saturated variants for light surfaces (≥4.5:1 on surfaceContainerLow).
const SEVERITY_COLOR: Record<'light' | 'dark', Record<Severity, string>> = {
  dark: {
    info: '#679cff', // Cyber Blue Light
    warning: '#FF9800',
    error: '#ff7351',
  },
  light: {
    info: '#0052b3', // Cyber Blue Deep
    warning: '#b26700', // warm amber, ≥4.5:1
    error: '#c63518', // Error Deep
  },
};

const SEVERITY_ICON: Record<Severity, IconName> = {
  info: 'info',
  warning: 'warning',
  error: 'warning',
};

/**
 * Inline notice banner. Translucent tint of the severity color over the
 * surface, full-radius pill-ish shape, icon + text only — no borders.
 */
export function WarningBanner({
  severity = 'warning',
  title,
  message,
  icon,
  style,
}: WarningBannerProps) {
  const scheme = useColorScheme() ?? 'dark';
  const accent = SEVERITY_COLOR[scheme][severity];
  const fillAlpha = scheme === 'light' ? '14' : '1F'; // ~8% light, ~12% dark
  const resolvedIcon = icon ?? SEVERITY_ICON[severity];
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: `${accent}${fillAlpha}` },
        style,
      ]}
      accessibilityRole="alert"
    >
      <Icon name={resolvedIcon} size={18} color={accent} />
      <View style={styles.textCol}>
        {title ? (
          <ThemedText
            variant="labelLg"
            style={[styles.title, { color: accent }]}
          >
            {title}
          </ThemedText>
        ) : null}
        <ThemedText variant="bodyMd" color="onSurface">
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.lg,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    letterSpacing: 0.4,
  },
});
