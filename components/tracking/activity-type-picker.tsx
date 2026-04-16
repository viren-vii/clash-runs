import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityChip } from '@/components/ui/activity-chip';
import { Spacing } from '@/constants/theme';
import type { SessionActivityType } from '@/lib/types';

interface ActivityTypePickerProps {
  selected: SessionActivityType;
  onSelect: (type: SessionActivityType) => void;
}

const ACTIVITIES: { type: SessionActivityType; label: string }[] = [
  { type: 'walk', label: 'Walk' },
  { type: 'run', label: 'Run' },
  { type: 'cycle', label: 'Cycle' },
];

export function ActivityTypePicker({
  selected,
  onSelect,
}: ActivityTypePickerProps) {
  return (
    <View style={styles.container}>
      {ACTIVITIES.map((a) => (
        <ActivityChip
          key={a.type}
          type={a.type}
          label={a.label}
          selected={selected === a.type}
          onPress={() => onSelect(a.type)}
          size="picker"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
});
