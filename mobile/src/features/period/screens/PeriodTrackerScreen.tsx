// PeriodTrackerScreen — calendar-based period tracker.
//
// Modes:
//   readOnly=false (Track tab): full edit capability
//   readOnly=true  (Today tab): display only, no editing
//
// Edit mode (✏️ pencil, only on current/past months):
//   — Tap a date within or before the current range → reset: new start, clear end
//   — Tap a date after the current end              → extend end forward
//   — Month-scoped: only dates in the month where ✏️ was clicked are accepted
//   — ✓ (tick) saves the range, ✕ cancels
//
// Predictions: current month + future months show light rose-pink circles
// based on period profile (last_period_start + avg_cycle_length).
// When that month arrives the predictions are editable; logged days override them.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { periodService, PeriodDayPayload } from '@/services/periodService';
import {
  format, addDays, parseISO,
  isAfter, isBefore, differenceInDays,
} from 'date-fns';

// ─── Calendar colours ─────────────────────────────────────────────────────────
const ROSE_PINK       = '#E8829E'; // logged period day
const ROSE_PINK_LIGHT = '#F4B8CA'; // predicted period day (visible pastel)
const ROSE_PINK_RANGE = '#E8829ECC'; // range-select preview (~80% opacity)
const GOLD            = '#C49A2A'; // today
const SUCCESS         = '#2D9F6F'; // confirm tick

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowLevel = 'light' | 'medium' | 'heavy' | 'spotting';

type PeriodDay = {
  log_date: string;
  flow_level?: FlowLevel;
  symptoms: string[];
  mood?: string;
};

type CalendarMark = {
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
};

type Props = {
  readOnly?: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FLOW_COLORS: Record<FlowLevel, string> = {
  spotting: colors.periodSpot,
  light:    colors.periodLight,
  medium:   colors.periodMedium,
  heavy:    colors.periodHeavy,
};

const FLOW_OPTIONS: { key: FlowLevel; label: string; emoji: string }[] = [
  { key: 'spotting', label: 'Spotting', emoji: '🌸' },
  { key: 'light',   label: 'Light',    emoji: '💧' },
  { key: 'medium',  label: 'Medium',   emoji: '🔴' },
  { key: 'heavy',   label: 'Heavy',    emoji: '💢' },
];

const SYMPTOM_OPTIONS = [
  'Cramps', 'Bloating', 'Headache', 'Fatigue',
  'Mood swings', 'Back pain', 'Cravings', 'Nausea',
];

const MOOD_OPTIONS = [
  { key: 'fine',   emoji: '😐' },
  { key: 'happy',  emoji: '😊' },
  { key: 'tired',  emoji: '😴' },
  { key: 'grumpy', emoji: '😤' },
  { key: 'sad',    emoji: '😢' },
  { key: 'crampy', emoji: '🤕' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns all dates between start and end (inclusive), normalised so start ≤ end. */
function datesInRange(start: string, end: string): string[] {
  const s = parseISO(start);
  const e = parseISO(end);
  if (isAfter(s, e)) return datesInRange(end, start);
  const result: string[] = [];
  let cur = s;
  while (!isAfter(cur, e)) {
    result.push(format(cur, 'yyyy-MM-dd'));
    cur = addDays(cur, 1);
  }
  return result;
}

/** Format "yyyy-MM-dd" → "26 Feb" */
function fmtDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM');
}

/**
 * Given a flat list of logged period days (sorted), find contiguous blocks
 * (gaps > 1 day = new block).  Returns an array of blocks, each block being
 * an array of date strings.
 */
function findPeriodBlocks(sorted: PeriodDay[]): string[][] {
  if (sorted.length === 0) return [];
  const blocks: string[][] = [];
  let block: string[] = [sorted[0].log_date];

  for (let i = 1; i < sorted.length; i++) {
    const gap = differenceInDays(
      parseISO(sorted[i].log_date),
      parseISO(sorted[i - 1].log_date),
    );
    if (gap <= 1) {
      block.push(sorted[i].log_date);
    } else {
      blocks.push(block);
      block = [sorted[i].log_date];
    }
  }
  blocks.push(block);
  return blocks;
}

/**
 * Builds markedDates for react-native-calendars (markingType="simple").
 *
 * Priority (lowest → highest):
 *   1. Predictions   — pastel pink (only when not in active selection)
 *   2. Logged days   — solid rose pink
 *                      Hidden once the user taps a first date in edit mode,
 *                      so the old cycle visually clears the moment selection starts.
 *   3. Range preview — ROSE_PINK_RANGE, fills the new range immediately
 *   4. Today         — gold (only outside the active range)
 */
function buildMarkedDates(
  days: PeriodDay[],
  today: string,
  predictedDays: string[],
  rangeMode: boolean,
  rangeStart?: string | null,
  rangeEnd?: string | null,
): Record<string, CalendarMark> {
  const periodSet = new Set(days.map((d) => d.log_date));
  const marked: Record<string, CalendarMark> = {};

  // 1. Predictions — pastel pink (hidden while actively selecting a range)
  if (!rangeStart) {
    predictedDays.forEach((date) => {
      if (!periodSet.has(date)) {
        marked[date] = {
          selected:          true,
          selectedColor:     ROSE_PINK_LIGHT,
          selectedTextColor: colors.textPrimary,
        };
      }
    });
  }

  // 2. Logged days — shown in normal view; erased the moment the user taps
  //    a first date in edit mode (rangeStart becomes non-null)
  if (!(rangeMode && rangeStart)) {
    periodSet.forEach((date) => {
      marked[date] = {
        selected:          true,
        selectedColor:     ROSE_PINK,
        selectedTextColor: '#fff',
      };
    });
  }

  // 3. Range preview — overrides everything, fills new selection immediately
  if (rangeStart && !rangeEnd) {
    marked[rangeStart] = {
      selected:          true,
      selectedColor:     ROSE_PINK_RANGE,
      selectedTextColor: '#fff',
    };
  }
  if (rangeStart && rangeEnd) {
    datesInRange(rangeStart, rangeEnd).forEach((date) => {
      marked[date] = {
        selected:          true,
        selectedColor:     ROSE_PINK_RANGE,
        selectedTextColor: '#fff',
      };
    });
  }

  // 4. Today — gold circle, but not when it's inside the active range
  const todayInRange = rangeStart && rangeEnd && today >= rangeStart && today <= rangeEnd;
  const todayIsStart = today === rangeStart;
  if (!periodSet.has(today) && !todayInRange && !todayIsStart) {
    marked[today] = {
      selected:          true,
      selectedColor:     GOLD,
      selectedTextColor: '#fff',
    };
  }

  return marked;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PeriodTrackerScreen({ readOnly = false }: Props) {
  const today      = format(new Date(), 'yyyy-MM-dd');
  const todayMonth = today.slice(0, 7);

  const [currentMonth, setCurrentMonth] = useState(todayMonth);
  const [periodDays, setPeriodDays]     = useState<PeriodDay[]>([]);
  const [markedDates, setMarkedDates]   = useState<Record<string, CalendarMark>>({});
  const [loading, setLoading]           = useState(false);
  // Recent logs (last 90 days) — used to predict next month from actual data
  const [recentLogs, setRecentLogs]     = useState<PeriodDay[]>([]);

  // ── Edit / range state ────────────────────────────────────────────────────
  const [rangeMode, setRangeMode]             = useState(false);
  const [editMonth, setEditMonth]             = useState<string | null>(null);
  const [rangeStart, setRangeStart]           = useState<string | null>(null);
  const [rangeEnd, setRangeEnd]               = useState<string | null>(null);
  const [confirmingRange, setConfirmingRange] = useState(false);

  // ── Day detail modal state ────────────────────────────────────────────────
  const [modalDate, setModalDate]               = useState<string | null>(null);
  const [modalVisible, setModalVisible]         = useState(false);
  const [selectedFlow, setSelectedFlow]         = useState<FlowLevel>('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood]         = useState('fine');
  const [saving, setSaving]                     = useState(false);

  // Future months are display-only (no editing allowed)
  const isFutureMonth = currentMonth > todayMonth;
  const canEdit       = !readOnly && !isFutureMonth;

  // ─── Next month: one calendar month ahead of today ───────────────────────
  const nextMonth = useMemo(() => {
    const [yr, mo] = todayMonth.split('-').map(Number);
    return format(new Date(yr, mo, 1), 'yyyy-MM'); // mo is 1-based; JS Date month is 0-based → mo = next month
  }, [todayMonth]);

  // ─── Recent logs — fetch last 90 days once on mount ───────────────────────
  const refreshRecentLogs = useCallback(async () => {
    try {
      const from = format(addDays(parseISO(today), -90), 'yyyy-MM-dd');
      const raw  = await periodService.getLogs(from, today);
      setRecentLogs(raw.map((r) => ({
        log_date:   r.log_date,
        flow_level: r.flow_level as FlowLevel | undefined,
        symptoms:   (r.symptoms as string[] | undefined) ?? [],
        mood:       r.mood,
      })));
    } catch {
      // silent — predictions just won't show
    }
  }, [today]);

  useEffect(() => { refreshRecentLogs(); }, [refreshRecentLogs]);

  // ─── Predict next month from actual tracked data ──────────────────────────
  //
  // Only shows circles when the user navigates to exactly the next month.
  // Algorithm:
  //   1. Find all contiguous period blocks in recent logs
  //   2. Take the last block → its start = last_start, length = duration
  //   3. If 2+ blocks, derive cycle length from distance between last two starts
  //   4. Project: next_start = last_start + cycle_length
  //   5. Clamp to next month boundaries
  const predictedDays = useMemo((): string[] => {
    if (currentMonth !== nextMonth) return []; // only predict for immediately next month
    if (recentLogs.length === 0) return [];

    const sorted = [...recentLogs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    const blocks  = findPeriodBlocks(sorted);
    if (blocks.length === 0) return [];

    const lastBlock   = blocks[blocks.length - 1];
    const lastStart   = parseISO(lastBlock[0]);
    const lastDuration = lastBlock.length;

    // Cycle length from last two blocks, clamped to realistic range (21–45 days)
    let cycleLen = 28;
    if (blocks.length >= 2) {
      const prevBlock  = blocks[blocks.length - 2];
      const computed   = differenceInDays(parseISO(lastBlock[0]), parseISO(prevBlock[0]));
      if (computed >= 21 && computed <= 45) cycleLen = computed;
    }

    const nextStart = addDays(lastStart, cycleLen);
    const nextEnd   = addDays(nextStart, lastDuration - 1);

    // Clamp to next month
    const [yr, mo] = nextMonth.split('-').map(Number);
    const monthStart = new Date(yr, mo - 1, 1);
    const monthEnd   = new Date(yr, mo, 0);

    const predicted: string[] = [];
    let cur = isAfter(nextStart, monthStart) ? nextStart : monthStart;
    while (!isAfter(cur, nextEnd) && !isAfter(cur, monthEnd)) {
      predicted.push(format(cur, 'yyyy-MM-dd'));
      cur = addDays(cur, 1);
    }
    return predicted;
  }, [currentMonth, nextMonth, recentLogs]);

  // ─── Fetch logs ───────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [year, month] = currentMonth.split('-');
      const from = `${year}-${month}-01`;
      const d    = new Date(parseInt(year), parseInt(month), 0);
      const to   = format(d, 'yyyy-MM-dd');
      const raw  = await periodService.getLogs(from, to);
      setPeriodDays(raw.map((r) => ({
        log_date:   r.log_date,
        flow_level: r.flow_level as FlowLevel | undefined,
        symptoms:   (r.symptoms as string[] | undefined) ?? [],
        mood:       r.mood,
      })));
    } catch {
      // silent — shows empty calendar
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Rebuild marks whenever deps change
  useEffect(() => {
    setMarkedDates(buildMarkedDates(periodDays, today, predictedDays, rangeMode, rangeStart, rangeEnd));
  }, [periodDays, today, predictedDays, rangeMode, rangeStart, rangeEnd]);

  // ─── Edit mode ────────────────────────────────────────────────────────────

  function enterEditMode() {
    setEditMonth(currentMonth);
    setRangeMode(true);
    setRangeStart(null);
    setRangeEnd(null);
  }

  function cancelRange() {
    setRangeMode(false);
    setRangeStart(null);
    setRangeEnd(null);
    setEditMonth(null);
  }

  // ─── Month navigation ─────────────────────────────────────────────────────

  function goPrevMonth() {
    setCurrentMonth((m) => {
      const d = parseISO(m + '-01');
      return format(new Date(d.getFullYear(), d.getMonth() - 1, 1), 'yyyy-MM');
    });
    cancelRange();
  }
  function goNextMonth() {
    setCurrentMonth((m) => {
      const d = parseISO(m + '-01');
      return format(new Date(d.getFullYear(), d.getMonth() + 1, 1), 'yyyy-MM');
    });
    cancelRange();
  }

  // ─── Calendar day press ───────────────────────────────────────────────────

  function handleDayPress(dateStr: string) {
    if (rangeMode) {
      // Month-scoped: only accept taps within the month where ✏️ was pressed
      if (editMonth && !dateStr.startsWith(editMonth)) return;

      // No start yet → first tap becomes start
      if (!rangeStart) {
        setRangeStart(dateStr);
        return;
      }

      // Start set, no end yet — second tap:
      //   • Same date: clear (cancel selection)
      //   • Earlier date: earlier = start, original first tap = end
      //   • Later date: original first tap = start, later = end
      if (!rangeEnd) {
        if (dateStr === rangeStart) {
          setRangeStart(null);
        } else if (dateStr < rangeStart) {
          // Second tap before first: swap so earlier is always start
          setRangeEnd(rangeStart);
          setRangeStart(dateStr);
        } else {
          setRangeEnd(dateStr);
        }
        return;
      }

      // Both set:
      // — tap AFTER end → extend end forward
      // — tap anywhere within/before range → reset to new start, await new end
      if (dateStr > rangeEnd) {
        setRangeEnd(dateStr);
      } else {
        setRangeStart(dateStr);
        setRangeEnd(null);
      }
      return;
    }

    // Display / normal mode — open day detail modal (edit only, not readOnly)
    if (readOnly) return;
    const existing = periodDays.find((d) => d.log_date === dateStr);
    setModalDate(dateStr);
    setSelectedFlow(existing?.flow_level ?? 'medium');
    setSelectedSymptoms(existing?.symptoms ?? []);
    setSelectedMood(existing?.mood ?? 'fine');
    setModalVisible(true);
  }

  // ─── Range confirmation ───────────────────────────────────────────────────

  async function confirmRange() {
    if (!rangeStart || !rangeEnd) return;
    setConfirmingRange(true);
    try {
      const newRange      = new Set(datesInRange(rangeStart, rangeEnd));
      const existingDates = new Set(periodDays.map((d) => d.log_date));

      // 1. Delete days that were logged but fall outside the new range.
      //    Without this, stale circles persist in display mode.
      const toDelete = [...existingDates].filter((d) => !newRange.has(d));

      // 2. Insert only days not already logged — preserves flow/mood detail
      //    the user may have set on existing days via the day-detail modal.
      const toAdd = [...newRange].filter((d) => !existingDates.has(d));

      // Sequential deletes first to avoid any constraint conflicts
      for (const d of toDelete) {
        await periodService.deleteDay(d);
      }
      // Parallel inserts for new days
      await Promise.all(
        toAdd.map((d) =>
          periodService.logDay({ log_date: d, flow_level: 'medium', symptoms: [], mood: 'fine' })
        )
      );

      cancelRange();
      await fetchLogs();         // refresh calendar display with updated data
      await refreshRecentLogs(); // recalculate next-month prediction
    } catch (err: any) {
      Alert.alert('Could not save', err.message || 'Please try again.');
    } finally {
      setConfirmingRange(false);
    }
  }

  // ─── Day detail save / delete ─────────────────────────────────────────────

  async function saveLog() {
    if (!modalDate) return;
    setSaving(true);
    try {
      await periodService.logDay({
        log_date: modalDate, flow_level: selectedFlow,
        symptoms: selectedSymptoms, mood: selectedMood,
      });
      setModalVisible(false);
      await fetchLogs();
    } catch (err: any) {
      Alert.alert('Hmm...', err.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function removeLog() {
    if (!modalDate) return;
    Alert.alert('Remove this day?', 'Unmarking this period day. Sure?', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await periodService.deleteDay(modalDate);
            setModalVisible(false);
            await fetchLogs();
          } catch {
            Alert.alert('Oops', 'Could not remove.');
          }
        },
      },
    ]);
  }

  // ─── Derived UI values ────────────────────────────────────────────────────

  const isLogged = modalDate ? periodDays.some((d) => d.log_date === modalDate) : false;

  const editHintText = (() => {
    if (!rangeMode) return null;
    if (!rangeStart) return 'Tap your period start date';
    if (!rangeEnd)   return `${fmtDate(rangeStart)} — tap end date`;
    const n = datesInRange(rangeStart, rangeEnd).length;
    return `${fmtDate(rangeStart)} → ${fmtDate(rangeEnd)}  (${n} day${n !== 1 ? 's' : ''})`;
  })();

  const periodCount = periodDays.length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper scrollable>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Period tracker</Text>
        <Text style={styles.subtitle}>
          {readOnly ? 'Your cycle at a glance 🩸' : 'Tap a day to log your flow 🩸'}
        </Text>
      </View>

      {/* Calendar card */}
      <View style={styles.calCard}>

        {/* ── Custom header: ← | Month Year | [✓] [✏️/✕] | → ────────────── */}
        <View style={styles.calHeader}>
          {/* ← prev */}
          <TouchableOpacity
            onPress={goPrevMonth}
            style={styles.arrowBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          {/* Month + Year — centred between arrows */}
          <Text style={styles.monthLabel}>
            {format(parseISO(currentMonth + '-01'), 'MMMM yyyy')}
          </Text>

          {/* Right side: edit controls + → */}
          <View style={styles.headerRight}>
            {!readOnly && rangeMode && rangeStart && rangeEnd && (
              <TouchableOpacity
                style={[styles.cornerBtn, styles.confirmBtn]}
                onPress={confirmRange}
                activeOpacity={0.75}
                disabled={confirmingRange}
              >
                <Text style={styles.cornerBtnText}>{confirmingRange ? '…' : '✓'}</Text>
              </TouchableOpacity>
            )}
            {!readOnly && canEdit && (
              <TouchableOpacity
                style={[styles.cornerBtn, rangeMode ? styles.cancelBtn : styles.editBtn]}
                onPress={rangeMode ? cancelRange : enterEditMode}
                activeOpacity={0.75}
              >
                <Text style={styles.cornerBtnText}>{rangeMode ? '✕' : '✏️'}</Text>
              </TouchableOpacity>
            )}
            {/* → next */}
            <TouchableOpacity
              onPress={goNextMonth}
              style={styles.arrowBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar — arrows hidden since we provide our own above */}
        {loading ? (
          <ActivityIndicator color={ROSE_PINK} style={styles.loader} />
        ) : (
          <Calendar
            key={currentMonth}
            current={currentMonth + '-01'}
            markedDates={markedDates}
            onDayPress={(d) => handleDayPress(d.dateString)}
            hideArrows
            enableSwipeMonths
            theme={calendarTheme}
          />
        )}

        {/* Edit hint — shown below calendar when in range mode */}
        {rangeMode && editHintText && (
          <View style={styles.editBar}>
            <Text style={styles.editHint}>{editHintText}</Text>
          </View>
        )}

        {/* Future month notice */}
        {isFutureMonth && !readOnly && (
          <View style={styles.futureNotice}>
            <Text style={styles.futureNoticeText}>
              Predicted based on your cycle · tap Track to edit past months
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ROSE_PINK }]} />
          <Text style={styles.legendText}>Period day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GOLD }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        {predictedDays.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: ROSE_PINK_LIGHT }]} />
            <Text style={styles.legendText}>Predicted</Text>
          </View>
        )}
        {periodCount > 0 && (
          <Text style={styles.legendCount}>
            {periodCount} day{periodCount !== 1 ? 's' : ''} this month
          </Text>
        )}
      </View>

      {/* Day detail modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalDate}>{modalDate ? fmtDate(modalDate) : ''}</Text>
              <Text style={styles.modalSub}>How's the flow today? 🩸</Text>

              <Text style={styles.sectionLabel}>Flow level</Text>
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
                    activeOpacity={0.75}
                  >
                    <Text style={styles.chipText}>{emoji} {label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Mood</Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map(({ key, emoji }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.moodBtn, selectedMood === key && styles.moodBtnActive]}
                    onPress={() => setSelectedMood(key)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.moodEmoji}>{emoji}</Text>
                    <Text style={styles.moodLabel}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Symptoms (optional)</Text>
              <View style={styles.chipRow}>
                {SYMPTOM_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, selectedSymptoms.includes(s) && styles.chipActive]}
                    onPress={() =>
                      setSelectedSymptoms((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                    activeOpacity={0.75}
                  >
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button label="Save" onPress={saveLog} loading={saving} style={styles.saveBtn} />
              {isLogged && (
                <Button
                  label="Remove this day"
                  variant="ghost"
                  onPress={removeLog}
                  style={styles.removeBtn}
                  textStyle={{ color: colors.error }}
                />
              )}
              <Button label="Cancel" variant="ghost" onPress={() => setModalVisible(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

// ─── Calendar theme ───────────────────────────────────────────────────────────

const calendarTheme = {
  backgroundColor:           'transparent',
  calendarBackground:        'transparent',
  textSectionTitleColor:     colors.textMuted,
  dayTextColor:              colors.textPrimary,
  textDisabledColor:         colors.textMuted,
  todayTextColor:            GOLD,
  arrowColor:                ROSE_PINK,
  monthTextColor:            colors.textPrimary,
  textMonthFontFamily:       fonts.serif,
  textDayFontFamily:         fonts.sans,
  textDayHeaderFontFamily:   fonts.sans,
  textDayFontSize:           14,
  textMonthFontSize:         16,
  textDayHeaderFontSize:     11,
  textDayFontWeight:         '500' as const,
  textMonthFontWeight:       '700' as const,
  // Hide the built-in month/year row — we render our own in calHeader
  'stylesheet.calendar.header': {
    header: { height: 0, overflow: 'hidden' },
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingTop:        spacing.base,
    paddingBottom:     spacing.sm,
    paddingHorizontal: spacing.base,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize:   fontSizes.xl,
    fontWeight: '700',
    color:      colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.cursive,
    fontSize:   fontSizes.base,
    color:      colors.textSecondary,
    marginTop:  2,
  },
  calCard: {
    backgroundColor:   colors.surface,
    marginHorizontal:  spacing.base,
    marginTop:         spacing.sm,
    borderRadius:      borderRadius.xl,
    paddingBottom:     spacing.sm,
    paddingHorizontal: spacing.xs,
    ...shadows.card,
  },
  loader: { marginVertical: spacing['3xl'] },

  // ── Custom calendar header: ← | Month Year | [✓] [✏️/✕] | → ───────────
  calHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.sm,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xs,
  },
  monthLabel: {
    flex:       1,
    fontFamily: fonts.serif,
    fontSize:   fontSizes.base,
    fontWeight: '700',
    color:      colors.textPrimary,
    textAlign:  'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
  },
  arrowBtn: {
    padding: spacing.xs,
  },
  arrowText: {
    fontSize:   26,
    color:      ROSE_PINK,
    lineHeight: 30,
  },
  cornerBtn: {
    width:          34,
    height:         34,
    borderRadius:   borderRadius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  confirmBtn:  { backgroundColor: SUCCESS      + '28' },
  cancelBtn:   { backgroundColor: colors.error + '22' },
  editBtn:     { backgroundColor: ROSE_PINK    + '22' },
  cornerBtnText: {
    fontSize:   15,
    color:      colors.textPrimary,
    fontWeight: '600',
  },

  // ── Edit hint ─────────────────────────────────────────────────────────────
  editBar: {
    paddingHorizontal: spacing.base,
    paddingTop:        spacing.xs,
    paddingBottom:     spacing.sm,
  },
  editHint: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.sm,
    color:      ROSE_PINK,
    fontWeight: '600',
    textAlign:  'center',
  },

  // ── Future month notice ───────────────────────────────────────────────────
  futureNotice: {
    paddingHorizontal: spacing.base,
    paddingBottom:     spacing.sm,
  },
  futureNoticeText: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xs,
    color:      colors.textMuted,
    textAlign:  'center',
  },

  // ── Legend ────────────────────────────────────────────────────────────────
  legend: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.base,
    paddingHorizontal: spacing.base,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.sm,
    flexWrap:          'wrap',
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendText: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xs,
    color:      colors.textMuted,
  },
  legendCount: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xs,
    color:      ROSE_PINK,
    fontWeight: '600',
    marginLeft: 'auto',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  overlay: {
    flex:            1,
    backgroundColor: colors.overlay,
    justifyContent:  'flex-end',
  },
  modalCard: {
    backgroundColor:      colors.surface,
    borderTopLeftRadius:  borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding:              spacing.xl,
    maxHeight:            '88%',
    ...shadows.strong,
  },
  modalDate: {
    fontFamily:   fonts.sans,
    fontSize:     fontSizes.md,
    fontWeight:   '700',
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSub: {
    fontFamily:   fonts.cursive,
    fontSize:     fontSizes.base,
    color:        colors.textSecondary,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily:    fonts.sans,
    fontSize:      fontSizes.xs,
    color:         colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.sm,
    marginBottom:  spacing.xl,
  },
  chip: {
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius:      borderRadius.full,
    borderWidth:       1,
    borderColor:       colors.border,
  },
  chipActive: {
    borderColor:     colors.accentBlue,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xs,
    color:      colors.textPrimary,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.sm,
    marginBottom:  spacing.xl,
  },
  moodBtn: {
    alignItems:   'center',
    padding:      spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth:  1,
    borderColor:  colors.border,
    minWidth:     60,
  },
  moodBtnActive: {
    borderColor:     colors.accentBlue,
    backgroundColor: colors.surfaceAlt,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xs,
    color:      colors.textMuted,
    marginTop:  2,
  },
  saveBtn:   { marginBottom: spacing.sm },
  removeBtn: { marginBottom: spacing.sm },
});
