import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  requestForegroundLocation,
  requestBackgroundLocation,
} from '@/lib/tracking/permissions';
import { getHealthService } from '@/lib/health/health-service';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ActivityColors } from '@/constants/theme';

interface Step {
  title: string;
  description: string;
  action: () => Promise<boolean>;
}

export default function PermissionsOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps: Step[] = [
    {
      title: 'Location Access',
      description:
        'We need your location to track your route while you run, walk, or cycle.',
      action: requestForegroundLocation,
    },
    {
      title: 'Background Location',
      description:
        'Allow background location so tracking continues when the app is minimized during your activity.',
      action: requestBackgroundLocation,
    },
    {
      title: 'Health Data',
      description:
        Platform.OS === 'ios'
          ? 'Connect to Apple Health to recover data if the app is interrupted and sync your workouts.'
          : 'Connect to Health Connect to recover data if the app is interrupted and sync your workouts.',
      action: async () => {
        const service = await getHealthService();
        if (service) {
          return await service.initialize();
        }
        return false;
      },
    },
  ];

  const step = steps[currentStep];

  const handleAction = async () => {
    setLoading(true);
    try {
      await step.action();
    } catch (e) {
      console.warn('Permission request failed:', e);
    }
    setLoading(false);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, paddingTop: insets.top + 20 },
      ]}
    >
      {/* Progress indicator */}
      <View style={styles.progress}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  i <= currentStep ? ActivityColors.running : cardColor,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={[styles.stepLabel, { color: subtleColor }]}>
          Step {currentStep + 1} of {steps.length}
        </Text>
        <Text style={[styles.title, { color: textColor }]}>{step.title}</Text>
        <Text style={[styles.description, { color: subtleColor }]}>
          {step.description}
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.allowButton, loading && styles.buttonDisabled]}
          onPress={handleAction}
          disabled={loading}
        >
          <Text style={styles.allowButtonText}>
            {loading ? 'Requesting...' : 'Allow'}
          </Text>
        </Pressable>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipButtonText, { color: subtleColor }]}>
            Skip for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
  },
  footer: {
    gap: 12,
  },
  allowButton: {
    backgroundColor: ActivityColors.running,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
  },
});
