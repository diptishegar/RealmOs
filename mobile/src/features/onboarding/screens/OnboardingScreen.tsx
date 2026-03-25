// OnboardingScreen — multi-step onboarding flow.
// 4 steps: Basic Info → Period → Lifestyle → Goals
//
// REACT NATIVE LESSON:
//   We use a local `step` state to control which step is showing.
//   This is the same pattern as a wizard/stepper in React web apps.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { userService } from '@/services/userService';
import { periodService } from '@/services/periodService';
import { useApp } from '@/store/AppContext';

// NOTE: User is already created via auth signup — onboarding just fills in health data.

// Each step's data lives in one flat state object for simplicity
type OnboardingData = {
  // Step 1 – Basic Info
  name: string;
  age: string;
  height: string;
  weight: string;
  // Step 2 – Period
  relationshipWithPeriod: 'yes' | 'no' | 'frenemy' | null;
  avgCycleLength: string;
  avgPeriodDuration: string;
  lastPeriodStart: string;
  // Step 3 – Lifestyle
  avgSleepHours: string;
  workoutDaysWeek: string;
  dailyWaterLitres: string;
  // Step 4 – Goals
  priorities: string[];
};

const TOTAL_STEPS = 4;

const PRIORITY_OPTIONS = ['health', 'fitness', 'diet', 'hormones', 'finances'];

const PERIOD_VIBES: { key: 'yes' | 'no' | 'frenemy'; label: string; emoji: string }[] = [
  { key: 'yes', label: 'We\'re besties', emoji: '💕' },
  { key: 'frenemy', label: 'Frenemy situation', emoji: '😤' },
  { key: 'no', label: 'Hard no', emoji: '😭' },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { state, setUser } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: state.user?.name ?? '', age: '', height: '', weight: '',
    relationshipWithPeriod: null,
    avgCycleLength: '28', avgPeriodDuration: '5', lastPeriodStart: '',
    avgSleepHours: '8', workoutDaysWeek: '4', dailyWaterLitres: '3',
    priorities: [],
  });

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function togglePriority(p: string) {
    setData((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter((x) => x !== p)
        : [...prev.priorities, p],
    }));
  }

  async function handleFinish() {
    if (!state.user) {
      Alert.alert('Oops!', 'Please sign in first.');
      return;
    }
    setLoading(true);
    try {
      const userId = state.user.id;

      // 1. Update existing user's physical stats (user was created during signup)
      await userService.update(userId, {
        age: data.age ? parseInt(data.age) : undefined,
        height_cm: data.height ? parseFloat(data.height) : undefined,
        weight_kg: data.weight ? parseFloat(data.weight) : undefined,
      });

      // 2. Save user goals (merge with any goals set during signup)
      await userService.updateGoals(userId, {
        sleep_hours: parseFloat(data.avgSleepHours) || 8,
        workout_days_week: parseInt(data.workoutDaysWeek) || 4,
        daily_water_ml: Math.round((parseFloat(data.dailyWaterLitres) || 3) * 1000),
        priority_areas: data.priorities,
      });

      // 3. Save period profile
      await periodService.upsertProfile({
        avg_cycle_length: parseInt(data.avgCycleLength) || 28,
        avg_period_duration: parseInt(data.avgPeriodDuration) || 5,
        last_period_start: data.lastPeriodStart || undefined,
        relationship_with_period: data.relationshipWithPeriod || 'neutral',
      });

      // 4. Mark onboarded locally + transition to main app
      await setUser({ ...state.user, onboarded: true });
      onComplete();
    } catch (err: any) {
      Alert.alert('Oops!', err.message || 'Something broke. The universe says try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper scrollable>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i < step && styles.progressDotActive]}
          />
        ))}
      </View>

      {/* Step content */}
      {step === 1 && <Step1 data={data} update={update} />}
      {step === 2 && <Step2 data={data} update={update} />}
      {step === 3 && <Step3 data={data} update={update} />}
      {step === 4 && <Step4 data={data} togglePriority={togglePriority} />}

      {/* Navigation */}
      <View style={styles.nav}>
        {step > 1 && (
          <Button
            label="← back"
            variant="ghost"
            onPress={() => setStep((s) => s - 1)}
            style={styles.backBtn}
          />
        )}
        {step < TOTAL_STEPS ? (
          <Button
            label="next →"
            onPress={() => {
              if (step === 1 && !data.name.trim()) {
                Alert.alert('Hey!', 'At least tell me your name, gorgeous 😉');
                return;
              }
              setStep((s) => s + 1);
            }}
            style={styles.nextBtn}
          />
        ) : (
          <Button
            label="let's go ✨"
            onPress={handleFinish}
            loading={loading}
            style={styles.nextBtn}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ data, update }: any) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>👋</Text>
      <Text style={styles.stepTitle}>hey gorgeous,</Text>
      <Text style={styles.stepSubtitle}>let's get to know you a little 😉</Text>

      <Input label="What's your name?" value={data.name}
        onChangeText={(v) => update('name', v)} placeholder="the queen herself" />
      <Input label="Age" value={data.age}
        onChangeText={(v) => update('age', v)} placeholder="just a number"
        keyboardType="numeric" />
      <Input label="Height (cm)" value={data.height}
        onChangeText={(v) => update('height', v)} placeholder="how tall is the queen"
        keyboardType="decimal-pad" />
      <Input label="Weight (kg)" value={data.weight}
        onChangeText={(v) => update('weight', v)} placeholder="between us, promise"
        keyboardType="decimal-pad" />
    </View>
  );
}

function Step2({ data, update }: any) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🩸</Text>
      <Text style={styles.stepTitle}>let's talk periods, bestie</Text>
      <Text style={styles.stepSubtitle}>no judgement, only data 💖</Text>

      <Text style={styles.fieldLabel}>Your vibe with your period?</Text>
      <View style={styles.chipRow}>
        {PERIOD_VIBES.map(({ key, label, emoji }) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, data.relationshipWithPeriod === key && styles.chipActive]}
            onPress={() => update('relationshipWithPeriod', key)}
          >
            <Text style={styles.chipText}>{emoji} {label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Average cycle length (days)" value={data.avgCycleLength}
        onChangeText={(v) => update('avgCycleLength', v)}
        placeholder="usually 28" keyboardType="numeric" />
      <Input label="Period duration (days)" value={data.avgPeriodDuration}
        onChangeText={(v) => update('avgPeriodDuration', v)}
        placeholder="usually 5" keyboardType="numeric" />
      <Input label="Last period start date" value={data.lastPeriodStart}
        onChangeText={(v) => update('lastPeriodStart', v)}
        placeholder="YYYY-MM-DD" />
    </View>
  );
}

function Step3({ data, update }: any) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>✨</Text>
      <Text style={styles.stepTitle}>lifestyle check</Text>
      <Text style={styles.stepSubtitle}>how's the daily routine looking?</Text>

      <Input label="Average sleep hours" value={data.avgSleepHours}
        onChangeText={(v) => update('avgSleepHours', v)}
        placeholder="beauty sleep report 😴" keyboardType="decimal-pad" />
      <Input label="Workout days per week" value={data.workoutDaysWeek}
        onChangeText={(v) => update('workoutDaysWeek', v)}
        placeholder="how many days do you slay" keyboardType="numeric" />
      <Input label="Daily water intake (litres)" value={data.dailyWaterLitres}
        onChangeText={(v) => update('dailyWaterLitres', v)}
        placeholder="hydration is self-love 💧" keyboardType="decimal-pad" />
    </View>
  );
}

function Step4({ data, togglePriority }: any) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={styles.stepTitle}>what are we tracking?</Text>
      <Text style={styles.stepSubtitle}>pick your focus areas (tap to select)</Text>

      <View style={styles.chipRow}>
        {PRIORITY_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, data.priorities.includes(p) && styles.chipActive]}
            onPress={() => togglePriority(p)}
          >
            <Text style={styles.chipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
    marginBottom: spacing['2xl'],
  },
  progressDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  progressDotActive: {
    backgroundColor: colors.accentBlue,
    width: 24,
  },
  step: {
    flex: 1,
    paddingTop: spacing.base,
  },
  stepEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  chipActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    textTransform: 'lowercase',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  backBtn: { flex: 0.4 },
  nextBtn: { flex: 0.55 },
});
