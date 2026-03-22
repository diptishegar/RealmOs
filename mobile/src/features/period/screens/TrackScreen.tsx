// TrackScreen — Period calendar for the Track tab.
//
// Read-only by default: calendar shows logged period days for the viewed month.
// < > arrows navigate between past months and current month (no future).
// Pen icon (top-right of card) opens an edit modal for the VIEWED month.
// In edit mode the user taps days to toggle them; Save syncs with backend.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar } from 'react-native-calendars';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { periodService } from '@/services/periodService';
import { format, endOfMonth, addMonths, subMonths, parseISO, eachDayOfInterval } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_PINK  = '#FF758F';

type MarkedDates = Record<string, {
  selected?: boolean;
  selectedColor?: string;
  marked?: boolean;
  dotColor?: string;
}>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds marked dates from a set of logged period days.
 * Fills every day between the earliest and latest date with PERIOD_PINK,
 * so the range appears as a solid block rather than isolated dots.
 */
function buildMarkedDates(dates: Set<string>, today: string): MarkedDates {
  const marked: MarkedDates = {};

  if (dates.size > 0) {
    const sorted = [...dates].sort();
    const first  = sorted[0];
    const last   = sorted[sorted.length - 1];

    // Fill the entire range first, then overlay actual logged days
    const range = eachDayOfInterval({
      start: parseISO(first),
      end:   parseISO(last),
    });
    range.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      marked[key] = { selected: true, selectedColor: PERIOD_PINK };
    });
  }

  // Today dot (only if today isn't a period day)
  if (!marked[today]) {
    marked[today] = { marked: true, dotColor: colors.deepPurple };
  }

  return marked;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackScreen() {
  const today        = format(new Date(), 'yyyy-MM-dd');
  const todayMonth   = today.slice(0, 7); // "YYYY-MM" — ceiling for navigation

  // Which month is currently displayed in the read-only calendar
  const [viewedMonth, setViewedMonth] = useState(todayMonth);

  const [periodDates, setPeriodDates] = useState<Set<string>>(new Set());
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [loading,     setLoading]     = useState(true);

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editDates,   setEditDates]   = useState<Set<string>>(new Set());
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch error shown on the main card
  const [fetchError,  setFetchError]  = useState('');

  const monthLabel = format(new Date(viewedMonth + '-01'), 'MMMM yyyy');

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goToPrevMonth() {
    setViewedMonth((m) => format(subMonths(new Date(m + '-01'), 1), 'yyyy-MM'));
  }

  function goToNextMonth() {
    setViewedMonth((m) => {
      const next = format(addMonths(new Date(m + '-01'), 1), 'yyyy-MM');
      return next <= todayMonth ? next : m; // never go past current month
    });
  }

  const isCurrentMonth = viewedMonth === todayMonth;

  // ── Fetch viewed month's period logs ────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [year, month] = viewedMonth.split('-');
      const from = `${year}-${month}-01`;
      const to   = format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'yyyy-MM-dd');

      const days  = await periodService.getLogs(from, to);
      const dates = new Set(days.map((d) => d.log_date));
      setPeriodDates(dates);
      setMarkedDates(buildMarkedDates(dates, today));
    } catch (err: any) {
      setFetchError(err.message || 'Could not load period data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [viewedMonth, today]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Edit modal ─────────────────────────────────────────────────────────────
  function openEdit() {
    setEditDates(new Set(periodDates)); // copy current state into edit buffer
    setSaveError('');
    setSaveSuccess(false);
    setEditVisible(true);
  }

  function toggleDate(dateString: string) {
    setEditDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateString)) next.delete(dateString);
      else next.add(dateString);
      return next;
    });
  }

  async function saveEdits() {
    setSaving(true);
    setSaveError('');
    try {
      const toAdd    = [...editDates].filter((d) => !periodDates.has(d));
      const toRemove = [...periodDates].filter((d) => !editDates.has(d));

      await Promise.all([
        ...toAdd.map((d) => periodService.logDay({ log_date: d, flow_level: 'medium' })),
        ...toRemove.map((d) => periodService.deleteDay(d)),
      ]);

      setSaveSuccess(true);
      setEditVisible(false);
      await fetchLogs();
      // Clear success banner after 2.5 s
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const editMarked = buildMarkedDates(editDates, today);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>

      {/* ── Save success banner ────────────────────────────────────────────── */}
      {saveSuccess ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>Changes saved!</Text>
        </View>
      ) : null}

      {/* ── Calendar card (read-only) ──────────────────────────────────────── */}
      <View style={styles.card}>

        {/* Card header */}
        <View style={styles.cardHeader}>

          {/* ← prev month */}
          <TouchableOpacity
            onPress={goToPrevMonth}
            style={styles.arrowBtn}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.arrowText}>{'‹'}</Text>
          </TouchableOpacity>

          {/* Month label + pen */}
          <View style={styles.headerCenter}>
            <Text style={styles.cardTitle}>Period Tracker</Text>
            <Text style={styles.cardSub}>{monthLabel}</Text>
          </View>

          <View style={styles.headerRight}>
            {/* → next month (disabled on current month) */}
            <TouchableOpacity
              onPress={goToNextMonth}
              disabled={isCurrentMonth}
              style={styles.arrowBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={[styles.arrowText, isCurrentMonth && styles.arrowDisabled]}>{'›'}</Text>
            </TouchableOpacity>

            {/* Pen icon */}
            <TouchableOpacity
              onPress={openEdit}
              style={styles.penBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.penIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Fetch error */}
        {fetchError ? (
          <Text style={styles.fetchError}>{fetchError}</Text>
        ) : null}

        {/* Calendar */}
        {loading ? (
          <ActivityIndicator
            color={colors.deepPurple}
            size="large"
            style={styles.loader}
          />
        ) : (
          <Calendar
            key={viewedMonth}              // remount when month changes
            current={viewedMonth + '-01'}
            markedDates={markedDates}
            theme={readOnlyCalendarTheme}
            hideExtraDays
            disableAllTouchEventsForDisabledDays
            hideArrows                     // we provide our own arrows
            style={styles.calendar}
          />
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: PERIOD_PINK }]} />
          <Text style={styles.legendLabel}>Period days</Text>
          <View style={[styles.legendDot, { backgroundColor: colors.deepPurple, marginLeft: spacing.base }]} />
          <Text style={styles.legendLabel}>Today</Text>
        </View>

      </View>

      {/* ── Edit modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setEditVisible(false)}
        statusBarTranslucent
      >
        <BlurView intensity={20} tint="dark" style={styles.blurOverlay}>

          <View style={styles.editCard}>

            <Text style={styles.editTitle}>Edit Period Days</Text>
            <Text style={styles.editSub}>{monthLabel} · tap a day to mark or unmark it.</Text>

            <Calendar
              key={'edit-' + viewedMonth}  // keep edit modal on the viewed month
              current={viewedMonth + '-01'}
              onDayPress={(day) => toggleDate(day.dateString)}
              markedDates={editMarked}
              theme={editCalendarTheme}
              hideExtraDays
              style={styles.editCalendar}
            />

            {/* Save error */}
            {saveError ? (
              <Text style={styles.saveError}>{saveError}</Text>
            ) : null}

            {/* Actions */}
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => setEditVisible(false)}
                disabled={saving}
                style={[styles.editBtn, styles.cancelBtn]}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveEdits}
                disabled={saving}
                style={[styles.editBtn, styles.saveBtn, saving && styles.btnDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>

        </BlurView>
      </Modal>

    </View>
  );
}

// ─── Calendar themes ──────────────────────────────────────────────────────────

// Read-only calendar — lives inside the sky-blue card
const readOnlyCalendarTheme = {
  backgroundColor:            colors.surface,
  calendarBackground:         colors.surface,
  textSectionTitleColor:      colors.textMuted,
  dayTextColor:               colors.textPrimary,
  todayTextColor:             colors.deepPurple,
  todayBackgroundColor:       'transparent',
  selectedDayBackgroundColor: PERIOD_PINK,
  selectedDayTextColor:       '#FFFFFF',
  textDisabledColor:          colors.textMuted,
  dotColor:                   colors.deepPurple,
  arrowColor:                 colors.deepPurple,
  monthTextColor:             colors.textPrimary,
  textDayFontFamily:          fonts.sans,
  textMonthFontFamily:        fonts.sans,
  textDayHeaderFontFamily:    fonts.sans,
  textDayFontSize:            13,
  textMonthFontSize:          15,
  textDayHeaderFontSize:      11,
  'stylesheet.calendar.header': {
    header: { display: 'none' }, // hide built-in header — we provide our own
  },
};

// Edit calendar — lives inside white popup card
const editCalendarTheme = {
  backgroundColor:            '#FFFFFF',
  calendarBackground:         '#FFFFFF',
  textSectionTitleColor:      'rgba(54, 33, 62, 0.45)',
  dayTextColor:               colors.deepPurple,
  todayTextColor:             PERIOD_PINK,
  selectedDayBackgroundColor: PERIOD_PINK,
  selectedDayTextColor:       '#FFFFFF',
  textDisabledColor:          'rgba(54, 33, 62, 0.25)',
  dotColor:                   colors.deepPurple,
  arrowColor:                 colors.deepPurple,
  monthTextColor:             colors.deepPurple,
  textDayFontFamily:          fonts.sans,
  textMonthFontFamily:        fonts.sans,
  textDayHeaderFontFamily:    fonts.sans,
  textDayFontSize:            14,
  textMonthFontSize:          16,
  textDayHeaderFontSize:      11,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Full screen — crystal canvas, card centered
  screen: {
    flex:            1,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: spacing.base,
  },

  // ── Main calendar card ─────────────────────────────────────────────────────
  card: {
    width:           '100%',
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    ...shadows.card,
  },

  cardHeader: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    marginBottom:    spacing.base,
  },
  headerCenter: {
    flex:       1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
  },
  cardTitle: {
    fontFamily:  fonts.sans,
    fontSize:    fontSizes.lg,
    fontWeight:  '700',
    color:       colors.textPrimary,
  },
  cardSub: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.sm,
    color:      colors.textSecondary,
    marginTop:  2,
  },

  arrowBtn: {
    padding: spacing.xs,
  },
  arrowText: {
    fontSize:   26,
    color:      colors.deepPurple,
    lineHeight: 30,
  },
  arrowDisabled: {
    opacity: 0.25,
  },

  penBtn: {
    padding: spacing.xs,
  },
  penIcon: {
    fontSize: 20,
  },

  calendar: {
    borderRadius: borderRadius.md,
  },
  loader: {
    paddingVertical: spacing['2xl'],
  },

  legend: {
    flexDirection:  'row',
    alignItems:     'center',
    marginTop:      spacing.base,
    gap:            spacing.xs,
  },
  legendDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xs,
    color:      colors.textSecondary,
  },

  // ── Edit modal ─────────────────────────────────────────────────────────────
  blurOverlay: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },

  editCard: {
    width:           '100%',
    backgroundColor: '#FFFFFF',
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    shadowColor:     colors.deepPurple,
    shadowOffset:    { width: 0, height: 12 },
    shadowOpacity:   0.30,
    shadowRadius:    28,
    elevation:       16,
  },

  editTitle: {
    fontFamily:   fonts.sans,
    fontSize:     fontSizes.lg,
    fontWeight:   '700',
    color:        colors.deepPurple,
    marginBottom: spacing.xs,
  },
  editSub: {
    fontFamily:   fonts.sans,
    fontSize:     fontSizes.sm,
    color:        'rgba(54, 33, 62, 0.55)',
    marginBottom: spacing.base,
  },

  editCalendar: {
    borderRadius: borderRadius.md,
  },

  editActions: {
    flexDirection: 'row',
    gap:           spacing.sm,
    marginTop:     spacing.base,
  },
  editBtn: {
    flex:           1,
    paddingVertical: spacing.md,
    borderRadius:    borderRadius.full,
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      48,
  },
  cancelBtn: {
    borderWidth:  1.5,
    borderColor:  'rgba(54, 33, 62, 0.22)',
  },
  cancelBtnText: {
    fontFamily:  fonts.sans,
    fontSize:    fontSizes.base,
    fontWeight:  '600',
    color:       colors.deepPurple,
  },
  saveBtn: {
    backgroundColor: colors.deepPurple,
  },
  saveBtnText: {
    fontFamily:  fonts.sans,
    fontSize:    fontSizes.base,
    fontWeight:  '600',
    color:       '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // ── Feedback ───────────────────────────────────────────────────────────────
  fetchError: {
    fontFamily:   fonts.sans,
    fontSize:     fontSizes.sm,
    color:        '#B91C1C',
    textAlign:    'center',
    marginBottom: spacing.sm,
  },
  saveError: {
    fontFamily:   fonts.sans,
    fontSize:     fontSizes.sm,
    color:        '#B91C1C',
    textAlign:    'center',
    marginTop:    spacing.sm,
    marginBottom: spacing.xs,
  },
  successBanner: {
    backgroundColor: '#15803D',
    borderRadius:    borderRadius.full,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom:    spacing.base,
    alignSelf:       'center',
  },
  successBannerText: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.sm,
    fontWeight: '600',
    color:      '#FFFFFF',
  },
});
