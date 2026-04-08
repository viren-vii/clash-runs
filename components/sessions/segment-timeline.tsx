import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ActivityColors } from '@/constants/theme';
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
  const subtleColor = useThemeColor({}, 'icon');
  const barBg = useThemeColor(
    { light: '#E0E0E0', dark: '#3A3A3C' },
    'background',
  );

  if (segments.length === 0 || totalDuration <= 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: barBg }]}>
        {segments.map((segment, index) => {
          const duration =
            (segment.endTime ?? Date.now()) - segment.startTime;
          const widthPercent = Math.max(
            (duration / totalDuration) * 100,
            2, // minimum visible width
          );
          const color =
            ActivityColors[segment.activityType] ?? ActivityColors.unknown;

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
                      ActivityColors[type] ?? ActivityColors.unknown,
                  },
                ]}
              />
              <Text style={[styles.legendLabel, { color: subtleColor }]}>
                {SEGMENT_LABELS[type] ?? type}
              </Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    // backgroundColor set dynamically via style prop
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
