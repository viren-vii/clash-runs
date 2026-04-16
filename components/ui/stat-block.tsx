import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Typography, type ColorToken } from '@/constants/theme';
import { ThemedText, type TypographyVariant } from '@/components/themed-text';

export type StatBlockProps = {
  value: string;
  label: string;
  unit?: string;
  /** Tweak scale. Default is `lg` (metricLg + labelSm) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Override value color (e.g. use `primary` for the live headline stat). */
  valueColor?: ColorToken;
  /** Left-align (default), 'center', or 'right' for flex rows. */
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
};

const VALUE_VARIANT: Record<NonNullable<StatBlockProps['size']>, TypographyVariant> = {
  sm: 'metricSm',
  md: 'metricMd',
  lg: 'metricLg',
  xl: 'metricXl',
};

const LABEL_VARIANT: Record<NonNullable<StatBlockProps['size']>, TypographyVariant> = {
  sm: 'labelSm',
  md: 'labelSm',
  lg: 'labelSm',
  xl: 'labelMd',
};

/**
 * Editorial metric+label pairing — big tabular number, tiny uppercase label
 * beneath (e.g. "165 / BPM"). Follows the "Hierarchy as Brand" directive of
 * pairing extreme scale shifts.
 */
export function StatBlock({
  value,
  label,
  unit,
  size = 'lg',
  valueColor = 'onSurface',
  align = 'left',
  style,
}: StatBlockProps) {
  const alignItems =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

  return (
    <View style={[{ alignItems }, style]}>
      <View style={styles.valueRow}>
        <ThemedText variant={VALUE_VARIANT[size]} color={valueColor}>
          {value}
        </ThemedText>
        {unit ? (
          <ThemedText
            variant="labelMd"
            color="onSurfaceVariant"
            style={styles.inlineUnit}
          >
            {unit}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText
        variant={LABEL_VARIANT[size]}
        color="onSurfaceVariant"
        style={styles.label}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  inlineUnit: {
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  label: {
    marginTop: 2,
    letterSpacing: 0.9,
  },
});

// Re-export Typography to let callers tune spacing against measured metrics.
export { Typography };
