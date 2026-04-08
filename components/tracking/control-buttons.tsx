import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { StatusColors } from '@/constants/theme';

interface ControlButtonsProps {
  status: 'idle' | 'active' | 'paused';
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export function ControlButtons({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
}: ControlButtonsProps) {
  const handlePress = (action: (() => void) | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action?.();
  };

  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.mainButton, { backgroundColor: StatusColors.completed }]}
          onPress={() => handlePress(onStart)}
          accessibilityRole="button"
          accessibilityLabel="Start activity"
        >
          <Text style={styles.mainButtonText}>START</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stop button */}
      <Pressable
        style={[styles.secondaryButton, { backgroundColor: StatusColors.active }]}
        onPress={() => handlePress(onStop)}
        onLongPress={() => handlePress(onStop)}
        accessibilityRole="button"
        accessibilityLabel="Stop activity"
      >
        <Text style={styles.secondaryButtonText}>STOP</Text>
      </Pressable>

      {/* Pause/Resume button */}
      {status === 'active' ? (
        <Pressable
          style={[styles.mainButton, { backgroundColor: StatusColors.paused }]}
          onPress={() => handlePress(onPause)}
          accessibilityRole="button"
          accessibilityLabel="Pause activity"
        >
          <Text style={[styles.mainButtonText, { color: '#1A1A1A' }]}>PAUSE</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.mainButton, { backgroundColor: StatusColors.completed }]}
          onPress={() => handlePress(onResume)}
          accessibilityRole="button"
          accessibilityLabel="Resume activity"
        >
          <Text style={styles.mainButtonText}>RESUME</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
