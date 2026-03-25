// PeriodTrackerScreen — calendar-based period day logging.
//
// REACT NATIVE LESSON:
//   react-native-calendars gives us a ready-made calendar.
//   We mark specific dates with custom dots/colors.
//   State flows: tap day → open flow selector → save to API → update UI.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { periodService } from '@/services/periodService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowLevel = 'light' | 'medium' | 'heavy' | 'spotting';

type PeriodDay = {
  log_date: string;
  flow_level?: FlowLevel;
  symptoms: string[];
  mood?: string;
};

type MarkedDates = Record<string, {
  selected?: boolean;
  selectedColor?: string;
  dotColor?: string;
  marked?: boolean;
}>;

// Map flow levels to colors from our palette
const FLOW_COLORS: Record<FlowLevel, string> = {
  spotting: colors.periodSpot,
  light:    colors.periodLight,
  medium:   colors.periodMedium,
  heavy:    colors.periodHeavy,
};

const FLOW_OPTIONS: { key: FlowLevel; label: string; emoji: string }[] = [
  { key: 'spotting', label: 'spotting',  emoji: '🌸' },
  { key: 'light',   label: 'light flow', emoji: '💧' },
  { key: 'medium',  label: 'medium',    emoji: '🔴' },
  { key: 'heavy',   label: 'heavy',     emoji: '💢' },
];

const SYMPTOM_OPTIONS = [
  'cramps', 'bloating', 'headache', 'fatigue',
  'mood swings', 'back pain', 'cravings', 'nausea',
];

const MOOD_OPTIONS = [
  { key: 'fine',    emoji: '😐' },
  { key: 'happy',   emoji: '😊' },
  { key: 'tired',   emoji: '😴' },
  { key: 'grumpy',  emoji: '😤' },
  { key: 'sad',     emoji: '😢' },
  { key: 'crampy',  emoji: '🤕' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PeriodTrackerScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [currentMonth, setCurrentMonth] = useState(today.slice(0, 7)); // "YYYY-MM"
  const [periodDays, setPeriodDays] = useState<PeriodDay[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Log form state
  const [selectedFlow, setSelectedFlow] = useState<FlowLevel>('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('fine');

  // Fetch period logs for current month
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [year, month] = currentMonth.split('-');
      const from = `${year}-${month}-01`;
      const to = format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'yyyy-MM-dd');

      const days = await periodService.getLogs(from, to);
      setPeriodDays(days);

      // Build markedDates object for the calendar
      const marked: MarkedDates = {};
      days.forEach((d) => {
        const color = d.flow_level ? FLOW_COLORS[d.flow_level] : colors.periodMedium;
        marked[d.log_date] = {
          selected: true,
          selectedColor: color,
        };
      });

      // Also mark today
      if (!marked[today]) {
        marked[today] = { marked: true, dotColor: colors.accent };
      }

      setMarkedDates(marked);
    } catch {
      // Silently fail — user sees empty calendar
    } finally {
      setLoading(false);
    }
  }, [currentMonth, today]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function openLogModal(date: string) {
    // Find existing log for this date (if any)
    const existing = periodDays.find((d) => d.log_date === date);
    setSelectedDate(date);
    setSelectedFlow(existing?.flow_level || 'medium');
    setSelectedSymptoms(existing?.symptoms || []);
    setSelectedMood(existing?.mood || 'fine');
    setModalVisible(true);
  }

  async function saveLog() {
    if (!selectedDate) return;
    setSaving(true);
    try {
      await periodService.logDay({
        log_date: selectedDate,
        flow_level: selectedFlow,
        symptoms: selectedSymptoms,
        mood: selectedMood,
      });
      setModalVisible(false);
      await fetchLogs(); // refresh calendar
    } catch (err: any) {
      Alert.alert('Hmm...', err.message || 'Could not save. Try again babe.');
    } finally {
      setSaving(false);
    }
  }

  async function removeLog() {
    if (!selectedDate) return;
    Alert.alert(
      'Remove this day?',
      'Unmarking this period day. You sure?',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await periodService.deleteDay(selectedDate);
              setModalVisible(false);
              await fetchLogs();
            } catch {
              Alert.alert('Oops', 'Could not remove.');
            }
          },
        },
      ]
    );
  }

  const isAlreadyLogged = selectedDate
    ? periodDays.some((d) => d.log_date === selectedDate)
    : false;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>period tracker</Text>
        <Text style={styles.subtitle}>tap a day to mark it 🩸</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accentBlue} style={styles.loader} />
      ) : (
        <Calendar
          current={currentMonth + '-01'}
          onMonthChange={(month) => {
            setCurrentMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
          }}
          onDayPress={(day) => openLogModal(day.dateString)}
          markedDates={markedDates}
          theme={calendarTheme}
          enableSwipeMonths
        />
      )}

      {/* Flow level legend */}
      <View style={styles.legend}>
        {FLOW_OPTIONS.map(({ key, label }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: FLOW_COLORS[key] }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Log Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {selectedDate} {isAlreadyLogged ? '(editing)' : ''}
              </Text>
              <Text style={styles.modalSubtitle}>
                how's the flow today babe? 🩸
              </Text>

              {/* Flow selector */}
              <Text style={styles.sectionLabel}>flow level</Text>
              <View style={styles.chipRow}>
                {FLOW_OPTIONS.map(({ key, label, emoji }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.chip,
                      { borderColor: FLOW_COLORS[key] },
                      selectedFlow === key && { backgroundColor: FLOW_COLORS[key] + '33' },
                    ]}
                    onPress={() => setSelectedFlow(key)}
                  >
                    <Text style={styles.chipText}>{emoji} {label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mood selector */}
              <Text style={styles.sectionLabel}>mood check</Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map(({ key, emoji }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.moodBtn, selectedMood === key && styles.moodBtnActive]}
                    onPress={() => setSelectedMood(key)}
                  >
                    <Text style={styles.moodEmoji}>{emoji}</Text>
                    <Text style={styles.moodLabel}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Symptoms */}
              <Text style={styles.sectionLabel}>symptoms (optional)</Text>
              <View style={styles.chipRow}>
                {SYMPTOM_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.chip,
                      selectedSymptoms.includes(s) && styles.chipActive,
                    ]}
                    onPress={() =>
                      setSelectedSymptoms((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                  >
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <Button label="save 💾" onPress={saveLog} loading={saving} style={styles.saveBtn} />
              {isAlreadyLogged && (
                <Button
                  label="remove this day"
                  variant="ghost"
                  onPress={removeLog}
                  style={styles.removeBtn}
                  textStyle={{ color: colors.error }}
                />
              )}
              <Button
                label="cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

// ─── Calendar Theme ───────────────────────────────────────────────────────────

const calendarTheme = {
  backgroundColor: colors.background,
  calendarBackground: colors.background,
  textSectionTitleColor: colors.textMuted,
  selectedDayBackgroundColor: colors.accent,
  selectedDayTextColor: colors.white,
  todayTextColor: colors.accentBlue,
  dayTextColor: colors.textPrimary,
  textDisabledColor: colors.textMuted,
  dotColor: colors.accent,
  selectedDotColor: colors.white,
  arrowColor: colors.accent,
  monthTextColor: colors.textPrimary,
  textDayFontFamily: fonts.sans,
  textMonthFontFamily: fonts.sans,
  textDayHeaderFontFamily: fonts.sans,
  textDayFontSize: 13,
  textMonthFontSize: 15,
  textDayHeaderFontSize: 11,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.base,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  loader: { marginTop: spacing['2xl'] },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '85%',
    ...shadows.strong,
  },
  modalTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  moodBtn: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
  },
  moodBtnActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.surfaceAlt,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveBtn: { marginBottom: spacing.sm },
  removeBtn: { marginBottom: spacing.sm },
  cancelBtn: {},
});
