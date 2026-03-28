// OnboardingScreen — 4-step health setup wizard.
// Steps: Basic Info → Period → Lifestyle → Goals
// All date inputs use an inline calendar. All numeric fields are validated.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { userService } from '@/services/userService';
import { periodService } from '@/services/periodService';
import { useApp } from '@/store/AppContext';
import { format, parseISO } from 'date-fns';

// ─── Calendar colour constants ────────────────────────────────────────────────
const ROSE_PINK = '#E8829E';
const GOLD      = '#C49A2A';

// ─── Validation rules ─────────────────────────────────────────────────────────
const RULES = {
  age:            { min: 12,  max: 90,  label: 'Age' },
  height:         { min: 130, max: 200, label: 'Height' },   // cm (Indian range)
  weight:         { min: 38,  max: 120, label: 'Weight' },   // kg
  cycleLength:    { min: 21,  max: 45,  label: 'Cycle length' },
  periodDuration: { min: 2,   max: 10,  label: 'Period duration' },
  sleepHours:     { min: 2,   max: 24,  label: 'Sleep hours' },
  workoutDays:    { min: 0,   max: 7,   label: 'Workout days' },
  waterLitres:    { min: 1,   max: 6,   label: 'Daily water' },
};

function inRange(value: string, rule: { min: number; max: number }): boolean {
  const n = parseFloat(value);
  return !isNaN(n) && n >= rule.min && n <= rule.max;
}

function rangeMsg(rule: { min: number; max: number; label: string }): string {
  return `${rule.label} must be between ${rule.min} and ${rule.max}.`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingData = {
  name: string;
  age: string; height: string; weight: string;
  relationshipWithPeriod: 'yes' | 'no' | 'frenemy' | null;
  avgCycleLength: string; avgPeriodDuration: string; lastPeriodStart: string;
  avgSleepHours: string; workoutDaysWeek: string; dailyWaterLitres: string;
  priorities: string[];
};

type StepErrors = Partial<Record<string, string>>;

const TOTAL_STEPS = 4;

const PRIORITY_OPTIONS = [
  { key: 'health',   emoji: '🌿' },
  { key: 'fitness',  emoji: '💪' },
  { key: 'diet',     emoji: '🥗' },
  { key: 'hormones', emoji: '🧬' },
  { key: 'finances', emoji: '💰' },
];

const PERIOD_VIBES: { key: 'yes' | 'no' | 'frenemy'; label: string; emoji: string }[] = [
  { key: 'yes',     label: "We're besties",      emoji: '💕' },
  { key: 'frenemy', label: 'Frenemy situation',  emoji: '😤' },
  { key: 'no',      label: 'Hard no',            emoji: '😭' },
];

// ─── DatePickerField ──────────────────────────────────────────────────────────
// Inline calendar that expands when tapped — cute & accessible.

function DatePickerField({
  label, value, onSelect, maxDate, minDate, error,
}: {
  label: string;
  value: string;
  onSelect: (date: string) => void;
  maxDate?: string;
  minDate?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const display = value ? format(parseISO(value), 'MMMM d, yyyy') : 'Tap to choose a date';

  return (
    <View style={dpStyles.container}>
      <Text style={dpStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[dpStyles.trigger, !!error && dpStyles.triggerError, open && dpStyles.triggerOpen]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={[dpStyles.valueText, !value && dpStyles.placeholder]}>{display}</Text>
        <Text style={dpStyles.icon}>{open ? '▲' : '📅'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={dpStyles.calWrap}>
          <Calendar
            current={value || today}
            maxDate={maxDate ?? today}
            minDate={minDate}
            onDayPress={(day) => { onSelect(day.dateString); setOpen(false); }}
            markedDates={value ? { [value]: { selected: true, selectedColor: ROSE_PINK } } : {}}
            theme={{
              backgroundColor:           'transparent',
              calendarBackground:        'transparent',
              todayTextColor:            GOLD,
              selectedDayBackgroundColor: ROSE_PINK,
              selectedDayTextColor:      '#fff',
              dayTextColor:              colors.textPrimary,
              textDisabledColor:         colors.textMuted,
              arrowColor:                ROSE_PINK,
              monthTextColor:            colors.textPrimary,
              textDayFontFamily:         fonts.sans,
              textMonthFontFamily:       fonts.serif,
              textDayHeaderFontFamily:   fonts.sans,
              textDayFontSize:           13,
              textMonthFontSize:         15,
              textMonthFontWeight:       '700' as const,
            }}
          />
        </View>
      )}
      {!!error && <Text style={dpStyles.errorText}>{error}</Text>}
    </View>
  );
}

const dpStyles = StyleSheet.create({
  container:    { marginBottom: spacing.base },
  label: {
    color: colors.textSecondary, fontFamily: fonts.sans,
    fontSize: fontSizes.sm, fontWeight: '500',
    marginBottom: spacing.xs + 2, letterSpacing: 0.3,
  },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.base,
    paddingVertical: spacing.md, minHeight: 50,
  },
  triggerOpen:  { borderColor: colors.inputFocusBorder, backgroundColor: colors.white },
  triggerError: { borderColor: colors.error },
  valueText:    { fontFamily: fonts.sans, fontSize: fontSizes.base, color: colors.inputText },
  placeholder:  { color: colors.inputPlaceholder },
  icon:         { fontSize: 16 },
  calWrap: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.borderLight,
    marginTop: spacing.xs, overflow: 'hidden',
    paddingVertical: spacing.xs,
  },
  errorText: {
    color: colors.error, fontFamily: fonts.sans,
    fontSize: fontSizes.xs, marginTop: spacing.xs,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { state, setUser } = useApp();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<StepErrors>({});

  const [data, setData] = useState<OnboardingData>({
    name: state.user?.name ?? '',
    age: '', height: '', weight: '',
    relationshipWithPeriod: null,
    avgCycleLength: '28', avgPeriodDuration: '5', lastPeriodStart: '',
    avgSleepHours: '8', workoutDaysWeek: '4', dailyWaterLitres: '3',
    priorities: [],
  });

  function set<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function togglePriority(p: string) {
    setData((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter((x) => x !== p)
        : [...prev.priorities, p],
    }));
  }

  // ─── Per-step validation ────────────────────────────────────────────────────

  function validateStep1(): StepErrors {
    const e: StepErrors = {};
    if (!data.name.trim())                          e.name = 'Name is required.';
    if (data.age && !inRange(data.age, RULES.age))  e.age  = rangeMsg(RULES.age);
    if (data.height && !inRange(data.height, RULES.height)) e.height = rangeMsg(RULES.height);
    if (data.weight && !inRange(data.weight, RULES.weight)) e.weight = rangeMsg(RULES.weight);
    return e;
  }

  function validateStep2(): StepErrors {
    const e: StepErrors = {};
    if (data.avgCycleLength && !inRange(data.avgCycleLength, RULES.cycleLength))
      e.avgCycleLength = rangeMsg(RULES.cycleLength);
    if (data.avgPeriodDuration && !inRange(data.avgPeriodDuration, RULES.periodDuration))
      e.avgPeriodDuration = rangeMsg(RULES.periodDuration);
    return e;
  }

  function validateStep3(): StepErrors {
    const e: StepErrors = {};
    if (!inRange(data.avgSleepHours, RULES.sleepHours))
      e.avgSleepHours = rangeMsg(RULES.sleepHours);
    if (!inRange(data.workoutDaysWeek, RULES.workoutDays))
      e.workoutDaysWeek = rangeMsg(RULES.workoutDays);
    if (!inRange(data.dailyWaterLitres, RULES.waterLitres))
      e.dailyWaterLitres = rangeMsg(RULES.waterLitres);
    return e;
  }

  function handleNext() {
    let e: StepErrors = {};
    if (step === 1) e = validateStep1();
    if (step === 2) e = validateStep2();
    if (step === 3) e = validateStep3();

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  }

  // ─── Final submission ────────────────────────────────────────────────────────

  async function handleFinish() {
    if (!state.user) { Alert.alert('Oops!', 'Please sign in first.'); return; }
    setLoading(true);
    try {
      const userId = state.user.id;

      await userService.update(userId, {
        name:      data.name.trim() || undefined,
        age:       data.age    ? parseInt(data.age)          : undefined,
        height_cm: data.height ? parseFloat(data.height)     : undefined,
        weight_kg: data.weight ? parseFloat(data.weight)     : undefined,
      });

      await userService.updateGoals(userId, {
        sleep_hours:       parseFloat(data.avgSleepHours)  || 8,
        workout_days_week: parseInt(data.workoutDaysWeek)  || 4,
        daily_water_ml:    Math.round((parseFloat(data.dailyWaterLitres) || 3) * 1000),
        priority_areas:    data.priorities,
      });

      await periodService.upsertProfile({
        avg_cycle_length:       parseInt(data.avgCycleLength)    || 28,
        avg_period_duration:    parseInt(data.avgPeriodDuration) || 5,
        last_period_start:      data.lastPeriodStart || undefined,
        relationship_with_period: data.relationshipWithPeriod || 'neutral',
      });

      await setUser({ ...state.user, onboarded: true });
      onComplete();
    } catch (err: any) {
      Alert.alert('Oops!', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper scrollable>
      {/* Step progress */}
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
        ))}
      </View>

      {step === 1 && <Step1 data={data} set={set} errors={errors} />}
      {step === 2 && <Step2 data={data} set={set} errors={errors} />}
      {step === 3 && <Step3 data={data} set={set} errors={errors} />}
      {step === 4 && <Step4 data={data} togglePriority={togglePriority} />}

      {/* Navigation */}
      <View style={styles.nav}>
        {step > 1 && (
          <Button label="← Back" variant="ghost"
            onPress={() => { setErrors({}); setStep((s) => s - 1); }}
            style={styles.backBtn} />
        )}
        {step < TOTAL_STEPS ? (
          <Button label="Next →" onPress={handleNext} style={styles.nextBtn} />
        ) : (
          <Button label="Let's go ✨" onPress={handleFinish}
            loading={loading} style={styles.nextBtn} />
        )}
      </View>
    </ScreenWrapper>
  );
}

// ─── Step 1 — Basic Info ─────────────────────────────────────────────────────

function Step1({ data, set, errors }: { data: OnboardingData; set: any; errors: StepErrors }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>👋</Text>
      <Text style={styles.stepTitle}>hey gorgeous,</Text>
      <Text style={styles.stepSub}>let's get to know you a little 😉</Text>

      <Input label="What's your name?" value={data.name}
        onChangeText={(v) => set('name', v)}
        placeholder="the queen herself"
        error={errors.name} />

      <Input label="Age" value={data.age}
        onChangeText={(v) => set('age', v)}
        placeholder={`${RULES.age.min}–${RULES.age.max}`}
        keyboardType="numeric"
        error={errors.age} />

      <Input label="Height (cm)" value={data.height}
        onChangeText={(v) => set('height', v)}
        placeholder={`${RULES.height.min}–${RULES.height.max} cm`}
        keyboardType="decimal-pad"
        error={errors.height} />

      <Input label="Weight (kg)" value={data.weight}
        onChangeText={(v) => set('weight', v)}
        placeholder={`${RULES.weight.min}–${RULES.weight.max} kg  (just between us 🤫)`}
        keyboardType="decimal-pad"
        error={errors.weight} />
    </View>
  );
}

// ─── Step 2 — Period ─────────────────────────────────────────────────────────

function Step2({ data, set, errors }: { data: OnboardingData; set: any; errors: StepErrors }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🩸</Text>
      <Text style={styles.stepTitle}>let's talk periods, bestie</Text>
      <Text style={styles.stepSub}>no judgement, only data 💖</Text>

      <Text style={styles.fieldLabel}>Your vibe with your period?</Text>
      <View style={styles.chipRow}>
        {PERIOD_VIBES.map(({ key, label, emoji }) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, data.relationshipWithPeriod === key && styles.chipActive]}
            onPress={() => set('relationshipWithPeriod', key)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipText}>{emoji} {label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Average cycle length (days)" value={data.avgCycleLength}
        onChangeText={(v) => set('avgCycleLength', v)}
        placeholder="usually 28"
        keyboardType="numeric"
        error={errors.avgCycleLength} />

      <Input label="Period duration (days)" value={data.avgPeriodDuration}
        onChangeText={(v) => set('avgPeriodDuration', v)}
        placeholder="usually 5"
        keyboardType="numeric"
        error={errors.avgPeriodDuration} />

      <DatePickerField
        label="Last period start date"
        value={data.lastPeriodStart}
        onSelect={(d) => set('lastPeriodStart', d)}
        maxDate={format(new Date(), 'yyyy-MM-dd')}
      />
    </View>
  );
}

// ─── Step 3 — Lifestyle ──────────────────────────────────────────────────────

function Step3({ data, set, errors }: { data: OnboardingData; set: any; errors: StepErrors }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>✨</Text>
      <Text style={styles.stepTitle}>lifestyle check</Text>
      <Text style={styles.stepSub}>how's the daily routine looking?</Text>

      <Input label={`Average sleep hours  (${RULES.sleepHours.min}–${RULES.sleepHours.max})`}
        value={data.avgSleepHours}
        onChangeText={(v) => set('avgSleepHours', v)}
        placeholder="beauty sleep 😴"
        keyboardType="decimal-pad"
        error={errors.avgSleepHours} />

      <Input label={`Workout days per week  (${RULES.workoutDays.min}–${RULES.workoutDays.max})`}
        value={data.workoutDaysWeek}
        onChangeText={(v) => set('workoutDaysWeek', v)}
        placeholder="how many days do you slay 💪"
        keyboardType="numeric"
        error={errors.workoutDaysWeek} />

      <Input label={`Daily water intake in litres  (${RULES.waterLitres.min}–${RULES.waterLitres.max})`}
        value={data.dailyWaterLitres}
        onChangeText={(v) => set('dailyWaterLitres', v)}
        placeholder="hydration is self-love 💧"
        keyboardType="decimal-pad"
        error={errors.dailyWaterLitres} />
    </View>
  );
}

// ─── Step 4 — Goals ──────────────────────────────────────────────────────────

function Step4({ data, togglePriority }: { data: OnboardingData; togglePriority: (p: string) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={styles.stepTitle}>what are we tracking?</Text>
      <Text style={styles.stepSub}>pick your focus areas 💫</Text>

      <View style={styles.chipRow}>
        {PRIORITY_OPTIONS.map(({ key, emoji }) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, data.priorities.includes(key) && styles.chipActive]}
            onPress={() => togglePriority(key)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipText}>{emoji} {key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {data.priorities.length === 0 && (
        <Text style={styles.goalsHint}>tap at least one to get started 👆</Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.base, marginBottom: spacing['2xl'],
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  dotActive: { backgroundColor: colors.accentBlue, width: 24 },
  step:      { flex: 1, paddingTop: spacing.base },
  stepEmoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.base },
  stepTitle: {
    fontFamily: fonts.serif, fontSize: fontSizes.xl,
    color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs,
  },
  stepSub: {
    fontFamily: fonts.cursive, fontSize: fontSizes.md,
    color: colors.textSecondary, textAlign: 'center', marginBottom: spacing['2xl'],
  },
  fieldLabel: {
    fontFamily: fonts.sans, fontSize: fontSizes.sm,
    color: colors.textSecondary, fontWeight: '500',
    letterSpacing: 0.3, marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.sm, marginBottom: spacing.xl,
  },
  chip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: 'transparent',
  },
  chipActive: { borderColor: colors.accentBlue, backgroundColor: colors.surfaceAlt },
  chipText: {
    fontFamily: fonts.sans, fontSize: fontSizes.sm,
    color: colors.textPrimary, textTransform: 'lowercase',
  },
  goalsHint: {
    fontFamily: fonts.cursive, fontSize: fontSizes.base,
    color: colors.textMuted, textAlign: 'center', marginTop: spacing.base,
  },
  nav: {
    flexDirection: 'row', justifyContent: 'flex-end',
    gap: spacing.sm, paddingVertical: spacing.xl,
  },
  backBtn: { flex: 0.4 },
  nextBtn: { flex: 0.55 },
});
