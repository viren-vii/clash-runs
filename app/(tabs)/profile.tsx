import React, { useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getAllSessions } from '@/lib/database/sessions-repository';
import { formatDistance, formatElapsedTime } from '@/lib/tracking/distance-calculator';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  useSettings,
  type UnitSystem,
  type ThemePreference,
} from '@/lib/settings/settings-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
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
  const displayWeight = weightUnit === 'lbs' ? Math.round(weight * 2.20462) : weight;
  const [weightInput, setWeightInput] = useState(String(displayWeight));
  const [showCalorieInfo, setShowCalorieInfo] = useState(false);

  // Keep input in sync when weight unit or weight changes
  React.useEffect(() => {
    const val = weightUnit === 'lbs' ? Math.round(weight * 2.20462) : weight;
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

  const unitOptions: { value: UnitSystem; label: string }[] = [
    { value: 'metric', label: 'Metric (km)' },
    { value: 'imperial', label: 'Imperial (mi)' },
  ];

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: textColor }]}>Profile</Text>

      {/* All-Time Stats */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          All-Time Stats
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textColor }]}>
              {stats.totalSessions}
            </Text>
            <Text style={[styles.statLabel, { color: subtleColor }]}>
              Activities
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textColor }]}>
              {formatDistance(stats.totalDistance, unitSystem)}
            </Text>
            <Text style={[styles.statLabel, { color: subtleColor }]}>
              Distance
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textColor }]}>
              {formatElapsedTime(stats.totalTime)}
            </Text>
            <Text style={[styles.statLabel, { color: subtleColor }]}>
              Time
            </Text>
          </View>
        </View>
      </View>

      {/* Units Setting */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Units</Text>
        <View style={styles.segmentedControl}>
          {unitOptions.map((option) => {
            const isActive = unitSystem === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.segment,
                  { borderColor },
                  isActive && styles.segmentActive,
                ]}
                onPress={() => setUnitSystem(option.value)}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} units`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isActive ? '#fff' : textColor },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Weight Setting */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.weightTitleRow}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Weight</Text>
          <Pressable
            onPress={() => setShowCalorieInfo(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="How are calories calculated?"
          >
            <View style={[styles.infoButton, { borderColor: subtleColor }]}>
              <Text style={[styles.infoButtonText, { color: subtleColor }]}>i</Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.weightInputRow}>
          <TextInput
            style={[styles.weightInput, { color: textColor, borderColor }]}
            value={weightInput}
            onChangeText={setWeightInput}
            onBlur={() => {
              const parsed = parseFloat(weightInput);
              if (!isNaN(parsed) && parsed > 0) {
                const kg = weightUnit === 'lbs' ? parsed / 2.20462 : parsed;
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
          <View style={styles.weightUnitToggle}>
            {(['kg', 'lbs'] as const).map((u) => {
              const isActive = weightUnit === u;
              return (
                <Pressable
                  key={u}
                  style={[
                    styles.weightUnitOption,
                    { borderColor },
                    isActive && styles.segmentActive,
                  ]}
                  onPress={() => setWeightUnit(u)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isActive ? '#fff' : textColor },
                    ]}
                  >
                    {u}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text style={[styles.weightHint, { color: subtleColor }]}>
          Used for calorie estimation in activity sessions
        </Text>
      </View>

      {/* Theme Setting */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Theme</Text>
        <View style={styles.segmentedControl}>
          {themeOptions.map((option) => {
            const isActive = themePreference === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.segment,
                  { borderColor },
                  isActive && styles.segmentActive,
                ]}
                onPress={() => setThemePreference(option.value)}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} theme`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isActive ? '#fff' : textColor },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Calorie info modal */}
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
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: cardColor,
                shadowColor: '#000',
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: textColor }]}>
              How Calories Are Calculated
            </Text>
            <Text style={[styles.modalBody, { color: subtleColor }]}>
              We estimate calories using the MET (Metabolic Equivalent of Task) method:{'\n\n'}
              <Text style={{ fontWeight: '700', color: textColor }}>Calories = MET x Weight x Duration</Text>
              {'\n\n'}MET values used:{'\n'}
              {'  '}Walking: 3.5{'\n'}
              {'  '}Running: 9.8{'\n'}
              {'  '}Cycling: 7.5{'\n\n'}
              Your weight is recorded with each session so calorie values stay accurate even if your weight changes over time.
            </Text>
            <Pressable
              style={styles.modalDismiss}
              onPress={() => setShowCalorieInfo(false)}
            >
              <Text style={styles.modalDismissText}>Got it</Text>
            </Pressable>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Weight
  weightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
  },
  weightUnitToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  weightUnitOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginLeft: -1,
    alignItems: 'center',
  },
  weightHint: {
    fontSize: 12,
    marginTop: 8,
  },

  // Calorie info modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  modalDismiss: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDismissText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
