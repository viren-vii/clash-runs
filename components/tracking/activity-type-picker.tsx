import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ActivityColors } from '@/constants/theme';
import type { SessionActivityType } from '@/lib/types';

interface ActivityTypePickerProps {
  selected: SessionActivityType;
  onSelect: (type: SessionActivityType) => void;
}

const ACTIVITIES: { type: SessionActivityType; label: string; icon: string }[] =
  [
    { type: 'walk', label: 'Walk', icon: '🚶' },
    { type: 'run', label: 'Run', icon: '🏃' },
    { type: 'cycle', label: 'Cycle', icon: '🚴' },
  ];

export function ActivityTypePicker({
  selected,
  onSelect,
}: ActivityTypePickerProps) {
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');

  return (
    <View style={styles.container}>
      {ACTIVITIES.map((activity) => {
        const isSelected = selected === activity.type;
        return (
          <Pressable
            key={activity.type}
            style={[
              styles.option,
              { backgroundColor: cardColor },
              isSelected && styles.optionSelected,
            ]}
            onPress={() => onSelect(activity.type)}
            accessibilityRole="button"
            accessibilityLabel={`${activity.label} activity`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={styles.icon}>{activity.icon}</Text>
            <Text
              style={[
                styles.label,
                { color: isSelected ? '#fff' : textColor },
              ]}
            >
              {activity.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: ActivityColors.running,
    borderColor: ActivityColors.running,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
