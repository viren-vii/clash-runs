import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { getAllSessions } from '@/lib/database/sessions-repository';
import {
  formatDistance,
  formatElapsedTime,
} from '@/lib/tracking/distance-calculator';
import { ThemedText } from '@/components/themed-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatBlock } from '@/components/ui/stat-block';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useSettings,
  type UnitSystem,
  type ThemePreference,
} from '@/lib/settings/settings-context';
import { Colors, PageInsets, Radii, Spacing, Typography } from '@/constants/theme';

type SegmentOption<T> = { value: T; label: string };

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelRole,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  labelRole: string;
}) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: isActive
                  ? palette.primary
                  : palette.surfaceContainerHigh,
              },
              pressed && { opacity: 0.88 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} ${labelRole}`}
            accessibilityState={{ selected: isActive }}
          >
            <ThemedText
              variant="labelLg"
              style={{
                color: isActive ? palette.onPrimary : palette.onSurface,
              }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const bgColor = useThemeColor({}, 'surface');
  const subtleColor = useThemeColor({}, 'onSurfaceVariant');

  const {
    unitSystem,
    themePreference,
    weight,
    setUnitSystem,
    setThemePreference,
    setWeight,
  } = useSettings();

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(
    unitSystem === 'imperial' ? 'lbs' : 'kg',
  );
  const displayWeight =
    weightUnit === 'lbs' ? Math.round(weight * 2.20462) : weight;
  const [weightInput, setWeightInput] = useState(String(displayWeight));
  const [showCalorieInfo, setShowCalorieInfo] = useState(false);

  React.useEffect(() => {
    const val =
      weightUnit === 'lbs' ? Math.round(weight * 2.20462) : weight;
    setWeightInput(String(val));
  }, [weightUnit, weight]);

  const [stats, setStats] = useState({
    totalSessions: 0,
    totalDistance: 0,
    totalTime: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const sessions = await getAllSessions();
      setStats({
        totalSessions: sessions.length,
        totalDistance: sessions.reduce((sum, s) => sum + s.totalDistance, 0),
        totalTime: sessions.reduce((sum, s) => sum + s.elapsedTime, 0),
      });
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const unitOptions: SegmentOption<UnitSystem>[] = [
    { value: 'metric', label: 'Metric (km)' },
    { value: 'imperial', label: 'Imperial (mi)' },
  ];
  const themeOptions: SegmentOption<ThemePreference>[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText variant="displaySm" color="onSurface" style={styles.title}>
        Profile
      </ThemedText>

      <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
        <ThemedText
          variant="titleMd"
          color="onSurface"
          style={styles.cardTitle}
        >
          All-Time Stats
        </ThemedText>
        <View style={styles.statsGrid}>
          <StatBlock
            size="sm"
            align="left"
            value={String(stats.totalSessions)}
            label="Activities"
          />
          <StatBlock
            size="sm"
            align="center"
            value={formatDistance(stats.totalDistance, unitSystem)}
            label="Distance"
          />
          <StatBlock
            size="sm"
            align="right"
            value={formatElapsedTime(stats.totalTime)}
            label="Time"
          />
        </View>
      </SurfaceCard>

      <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
        <ThemedText variant="titleMd" color="onSurface" style={styles.cardTitle}>
          Units
        </ThemedText>
        <SegmentedControl
          options={unitOptions}
          value={unitSystem}
          onChange={setUnitSystem}
          labelRole="units"
        />
      </SurfaceCard>

      <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
        <View style={styles.weightTitleRow}>
          <ThemedText variant="titleMd" color="onSurface">
            Weight
          </ThemedText>
          <Pressable
            onPress={() => setShowCalorieInfo(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="How are calories calculated?"
          >
            <View style={[styles.infoButton, { borderColor: subtleColor }]}>
              <ThemedText
                variant="labelMd"
                style={{ color: subtleColor, fontStyle: 'italic' }}
              >
                i
              </ThemedText>
            </View>
          </Pressable>
        </View>
        <View style={styles.weightInputRow}>
          {/* Underline-only input per Precision design system */}
          <View
            style={[
              styles.weightInputWrap,
              { borderBottomColor: palette.outline },
            ]}
          >
            <TextInput
              style={[
                Typography.metricSm as object,
                { color: palette.onSurface, flex: 1, paddingVertical: 8 },
              ]}
              value={weightInput}
              onChangeText={setWeightInput}
              onBlur={() => {
                const parsed = parseFloat(weightInput);
                if (!isNaN(parsed) && parsed > 0) {
                  const kg =
                    weightUnit === 'lbs' ? parsed / 2.20462 : parsed;
                  setWeight(Math.round(kg * 10) / 10);
                } else {
                  setWeightInput(String(displayWeight));
                }
              }}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder={weightUnit === 'lbs' ? '154' : '70'}
              placeholderTextColor={subtleColor}
              accessibilityLabel={`Weight in ${weightUnit === 'lbs' ? 'pounds' : 'kilograms'}`}
            />
          </View>
          <View
            style={styles.weightUnitToggle}
            accessibilityRole="radiogroup"
          >
            {(['kg', 'lbs'] as const).map((u) => {
              const isActive = weightUnit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setWeightUnit(u)}
                  style={[
                    styles.weightUnitOption,
                    {
                      backgroundColor: isActive
                        ? palette.primary
                        : palette.surfaceContainerHigh,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={u === 'kg' ? 'Kilograms' : 'Pounds'}
                >
                  <ThemedText
                    variant="labelLg"
                    style={{
                      color: isActive ? palette.onPrimary : palette.onSurface,
                    }}
                  >
                    {u}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <ThemedText
          variant="labelSm"
          color="onSurfaceDim"
          style={styles.weightHint}
        >
          USED FOR CALORIE ESTIMATION IN ACTIVITY SESSIONS
        </ThemedText>
      </SurfaceCard>

      <SurfaceCard tier="surfaceContainerLow" radius="xl" padding={Spacing.lg}>
        <ThemedText variant="titleMd" color="onSurface" style={styles.cardTitle}>
          Theme
        </ThemedText>
        <SegmentedControl
          options={themeOptions}
          value={themePreference}
          onChange={setThemePreference}
          labelRole="theme"
        />
      </SurfaceCard>

      <Modal
        visible={showCalorieInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalorieInfo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCalorieInfo(false)}
        >
          <SurfaceCard
            tier="surfaceContainerHigh"
            radius="xl"
            padding={Spacing.xl}
            style={styles.modalContent}
          >
            <ThemedText
              variant="headlineSm"
              color="onSurface"
              style={styles.modalTitle}
            >
              How Calories Are Calculated
            </ThemedText>
            <ThemedText
              variant="bodyMd"
              color="onSurfaceVariant"
              style={styles.modalBody}
            >
              We estimate calories using the MET (Metabolic Equivalent of Task)
              method:{'\n\n'}
              <ThemedText
                variant="bodyMd"
                color="onSurface"
                style={styles.modalEmphasis}
              >
                Calories = MET × Weight × Duration
              </ThemedText>
              {'\n\n'}MET values used:{'\n'}
              {'  '}Walking: 3.5{'\n'}
              {'  '}Running: 9.8{'\n'}
              {'  '}Cycling: 7.5{'\n\n'}
              Your weight is recorded with each session so calorie values stay
              accurate even if your weight changes over time.
            </ThemedText>
            <PrimaryButton
              label="Got it"
              size="md"
              onPress={() => setShowCalorieInfo(false)}
              style={styles.modalDismiss}
            />
          </SurfaceCard>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  title: {
    letterSpacing: -0.72,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.full,
    alignItems: 'center',
  },

  // Weight
  weightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  weightInputWrap: {
    flex: 1,
    borderBottomWidth: 1.5,
  },
  weightUnitToggle: {
    flexDirection: 'row',
    borderRadius: Radii.full,
    overflow: 'hidden',
    gap: 4,
  },
  weightUnitOption: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.full,
    alignItems: 'center',
  },
  weightHint: {
    marginTop: Spacing.sm,
    letterSpacing: 0.8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  modalBody: {
    lineHeight: 22,
  },
  modalEmphasis: {
    fontWeight: '700',
  },
  modalDismiss: {
    marginTop: Spacing.lg,
  },
});
