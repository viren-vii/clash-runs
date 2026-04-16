import React from 'react';
import { StyleSheet, View } from 'react-native';

import { getActivityColors, Radii, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ActivitySegment } from '@/lib/types';

interface SegmentTimelineProps {
  segments: ActivitySegment[];
  totalDuration: number;
}

const SEGMENT_LABELS: Record<string, string> = {
  running: 'Run',
  walking: 'Walk',
  cycling: 'Cycle',
  stationary: 'Stop',
  unknown: '?',
};

export function SegmentTimeline({
  segments,
  totalDuration,
}: SegmentTimelineProps) {
  const barBg = useThemeColor({}, 'surfaceContainerHigh');
  const scheme = useColorScheme() ?? 'dark';
  const activityColors = getActivityColors(scheme);

  if (segments.length === 0 || totalDuration <= 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: barBg }]}>
        {segments.map((segment, index) => {
          const duration =
            (segment.endTime ?? Date.now()) - segment.startTime;
          const widthPercent = Math.max(
            (duration / totalDuration) * 100,
            2,
          );
          const color =
            activityColors[segment.activityType as keyof typeof activityColors] ??
            activityColors.unknown;

          return (
            <View
              key={index}
              style={[
                styles.segment,
                { width: `${widthPercent}%`, backgroundColor: color },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        {Array.from(new Set(segments.map((s) => s.activityType))).map(
          (type) => (
            <View key={type} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      activityColors[type as keyof typeof activityColors] ??
                      activityColors.unknown,
                  },
                ]}
              />
              <ThemedText variant="labelMd" color="onSurfaceVariant">
                {SEGMENT_LABELS[type] ?? type}
              </ThemedText>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
  },
});
