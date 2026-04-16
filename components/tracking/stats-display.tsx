import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  formatElapsedTime,
  formatDistance,
  formatPace,
  getPaceUnit,
} from '@/lib/tracking/distance-calculator';
import { ThemedText } from '@/components/themed-text';
import { StatBlock } from '@/components/ui/stat-block';
import { useSettings } from '@/lib/settings/settings-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

interface StatsDisplayProps {
  elapsedTime: number;
  totalDistance: number;
  currentPace: number | null;
  compact?: boolean;
  /** Render on top of a colored surface (inverts label contrast). */
  invertColors?: boolean;
}

export function StatsDisplay({
  elapsedTime,
  totalDistance,
  currentPace,
  compact = false,
  invertColors = false,
}: StatsDisplayProps) {
  const { unitSystem } = useSettings();
  const paceUnit = getPaceUnit(unitSystem);
  // Divider: scheme-aware subtle tint on the surface beneath. When `invertColors`
  // is set we're on a colored fill (e.g. primary) so use a white wash instead.
  const neutralDivider = useThemeColor({}, 'outlineVariant');

  if (compact) {
    const dividerBg = invertColors ? 'rgba(255,255,255,0.35)' : neutralDivider;
    return (
      <View style={styles.compactRow}>
        <ThemedText variant="metricSm" color={invertColors ? 'onPrimary' : 'onSurface'}>
          {formatDistance(totalDistance, unitSystem)}
        </ThemedText>
        <View style={[styles.compactDivider, { backgroundColor: dividerBg }]} />
        <ThemedText variant="metricSm" color={invertColors ? 'onPrimary' : 'onSurface'}>
          {formatElapsedTime(elapsedTime)}
        </ThemedText>
        <View style={[styles.compactDivider, { backgroundColor: dividerBg }]} />
        <ThemedText variant="metricSm" color={invertColors ? 'onPrimary' : 'onSurface'}>
          {formatPace(currentPace, unitSystem)} {paceUnit}
        </ThemedText>
      </View>
    );
  }

  const valueColor = invertColors ? 'onPrimary' : 'onSurface';

  return (
    <View style={styles.grid}>
      <StatBlock
        size="md"
        align="left"
        value={formatElapsedTime(elapsedTime)}
        label="Time"
        valueColor={valueColor}
      />
      <StatBlock
        size="lg"
        align="left"
        value={formatDistance(totalDistance, unitSystem)}
        label="Distance"
        valueColor={valueColor}
      />
      <StatBlock
        size="md"
        align="right"
        value={`${formatPace(currentPace, unitSystem)} ${paceUnit}`}
        label="Pace"
        valueColor={valueColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  compactDivider: {
    width: 1,
    height: 16,
    borderRadius: 1,
  },
});
