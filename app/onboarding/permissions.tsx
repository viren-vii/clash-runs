import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  requestForegroundLocation,
  requestBackgroundLocation,
} from '@/lib/tracking/permissions';
import { getHealthService } from '@/lib/health/health-service';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, PageInsets, Radii, Spacing } from '@/constants/theme';

interface Step {
  title: string;
  description: string;
  action: () => Promise<boolean>;
}

export default function PermissionsOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const bgColor = useThemeColor({}, 'surface');
  const inactiveTrack = useThemeColor({}, 'surfaceContainerHigh');

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
        { backgroundColor: bgColor, paddingTop: insets.top + Spacing.lg },
      ]}
    >
      {/* Progress indicator — lime segments */}
      <View style={styles.progress}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  i <= currentStep ? palette.primary : inactiveTrack,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        <ThemedText
          variant="labelMd"
          color="onSurfaceVariant"
          style={styles.stepLabel}
        >
          STEP {currentStep + 1} OF {steps.length}
        </ThemedText>
        <ThemedText
          variant="displaySm"
          color="onSurface"
          style={styles.title}
        >
          {step.title}
        </ThemedText>
        <ThemedText
          variant="bodyLg"
          color="onSurfaceVariant"
          style={styles.description}
        >
          {step.description}
        </ThemedText>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={loading ? 'Requesting...' : 'Allow'}
          size="lg"
          onPress={handleAction}
          disabled={loading}
        />
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <ThemedText variant="labelLg" color="onSurfaceVariant">
            Skip for now
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: Radii.full,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepLabel: {
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  title: {
    letterSpacing: -0.72,
    marginBottom: Spacing.md,
  },
  description: {
    lineHeight: 24,
  },
  footer: {
    gap: Spacing.md,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
});
