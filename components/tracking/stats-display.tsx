import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  formatElapsedTime,
  formatDistance,
  formatPace,
  getPaceUnit,
} from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/lib/settings/settings-context';

interface StatsDisplayProps {
  elapsedTime: number;
  totalDistance: number;
  currentPace: number | null;
  compact?: boolean;
  /** Use white text (for display on colored backgrounds) */
  invertColors?: boolean;
}

export function StatsDisplay({
  elapsedTime,
  totalDistance,
  currentPace,
  compact = false,
  invertColors = false,
}: StatsDisplayProps) {
  const themeTextColor = useThemeColor({}, 'text');
  const themeSubtleColor = useThemeColor({}, 'icon');
  const textColor = invertColors ? '#fff' : themeTextColor;
  const subtleColor = invertColors ? 'rgba(255,255,255,0.7)' : themeSubtleColor;
  const { unitSystem } = useSettings();
  const paceUnit = getPaceUnit(unitSystem);

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Text style={[styles.compactValue, { color: textColor }]}>
          {formatDistance(totalDistance, unitSystem)}
        </Text>
        <Text style={[styles.compactSeparator, { color: subtleColor }]}>
          {' | '}
        </Text>
        <Text style={[styles.compactValue, { color: textColor }]}>
          {formatElapsedTime(elapsedTime)}
        </Text>
        <Text style={[styles.compactSeparator, { color: subtleColor }]}>
          {' | '}
        </Text>
        <Text style={[styles.compactValue, { color: textColor }]}>
          {formatPace(currentPace, unitSystem)} {paceUnit}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: textColor }]}>
          {formatElapsedTime(elapsedTime)}
        </Text>
        <Text style={[styles.statLabel, { color: subtleColor }]}>Time</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: textColor }]}>
          {formatDistance(totalDistance, unitSystem)}
        </Text>
        <Text style={[styles.statLabel, { color: subtleColor }]}>
          Distance
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: textColor }]}>
          {formatPace(currentPace, unitSystem)} {paceUnit}
        </Text>
        <Text style={[styles.statLabel, { color: subtleColor }]}>Pace</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactValue: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  compactSeparator: {
    fontSize: 14,
  },
});
