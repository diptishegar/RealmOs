// TodayScreen — today's snapshot with the current month's period calendar.
//
// Calendar is read-only (no edit mode).
// Today's date circle is golden; today's day number is one font size larger.
// Shows whatever period data has been logged for the current month.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { periodService } from '@/services/periodService';
import { useApp } from '@/store/AppContext';
import { format, endOfMonth, parseISO, eachDayOfInterval } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_COLOR = colors.periodMedium;
const TODAY_GOLD   = colors.warning;

type MarkedDates = Record<string, {
  selected?: boolean;
  selectedColor?: string;
  marked?: boolean;
  dotColor?: string;
  customStyles?: object;
}>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMarkedDates(dates: Set<string>, today: string): MarkedDates {
  const marked: MarkedDates = {};

  if (dates.size > 0) {
    const sorted = [...dates].sort();
    const first  = sorted[0];
    const last   = sorted[sorted.length - 1];

    eachDayOfInterval({ start: parseISO(first), end: parseISO(last) }).forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      marked[key] = { selected: true, selectedColor: PERIOD_COLOR };
    });
  }

  // Today — golden circle, always on top
  marked[today] = { selected: true, selectedColor: TODAY_GOLD };

  return marked;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TodayScreen() {
  const { state } = useApp();
  const today        = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = today.slice(0, 7);
  const monthLabel   = format(new Date(currentMonth + '-01'), 'MMMM yyyy');
  const dateLabel    = format(new Date(), 'EEEE, d MMMM');

  const name = (() => {
    const raw = state.user?.name ?? 'gorgeous';
    return raw.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  })();

  const [periodDates, setPeriodDates] = useState<Set<string>>(new Set());
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [loading,     setLoading]     = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [year, month] = currentMonth.split('-');
      const from = `${year}-${month}-01`;
      const to   = format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'yyyy-MM-dd');
      const days = await periodService.getLogs(from, to);
      const dates = new Set(days.map((d) => d.log_date));
      setPeriodDates(dates);
      setMarkedDates(buildMarkedDates(dates, today));
    } catch {
      setMarkedDates(buildMarkedDates(new Set(), today));
    } finally {
      setLoading(false);
    }
  }, [currentMonth, today]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <ScreenWrapper scrollable>

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <View style={styles.greetingCard}>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <Text style={styles.greeting}>Hey {name} ✨</Text>
        <Text style={styles.greetingSub}>Here's your day so far.</Text>
      </View>

      {/* ── Period calendar card ──────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>This Month</Text>
          <Text style={styles.cardSub}>{monthLabel}</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.accentBlue}
            size="large"
            style={styles.loader}
          />
        ) : (
          <Calendar
            key={currentMonth}
            current={currentMonth + '-01'}
            markedDates={markedDates}
            theme={calendarTheme}
            hideExtraDays
            hideArrows
            disableAllTouchEventsForDisabledDays
            style={styles.calendar}
          />
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: TODAY_GOLD }]} />
          <Text style={styles.legendLabel}>Today</Text>
          <View style={[styles.legendDot, { backgroundColor: PERIOD_COLOR, marginLeft: spacing.base }]} />
          <Text style={styles.legendLabel}>Period days</Text>
        </View>
      </View>

    </ScreenWrapper>
  );
}

// ─── Calendar theme ───────────────────────────────────────────────────────────

const calendarTheme = {
  backgroundColor:            colors.surface,
  calendarBackground:         colors.surface,
  textSectionTitleColor:      colors.textMuted,
  dayTextColor:               colors.textPrimary,

  todayTextColor:             TODAY_GOLD,
  todayBackgroundColor:       TODAY_GOLD,

  selectedDayBackgroundColor: PERIOD_COLOR,
  selectedDayTextColor:       '#FFFFFF',
  textDisabledColor:          colors.textMuted,
  dotColor:                   colors.accentBlue,
  arrowColor:                 colors.accentBlue,
  monthTextColor:             colors.textPrimary,

  textDayFontFamily:          fonts.sans,
  textMonthFontFamily:        fonts.sans,
  textDayHeaderFontFamily:    fonts.sans,

  textDayFontSize:            13,
  textMonthFontSize:          15,
  textDayHeaderFontSize:      11,

  textDayStyle:               {},
  todayTextFontSize:          15,

  'stylesheet.calendar.header': {
    header: { display: 'none' },
  },
  'stylesheet.day.basic': {
    today: {
      backgroundColor: TODAY_GOLD,
      borderRadius:    16,
    },
    todayText: {
      color:      '#FFFFFF',
      fontWeight: '700',
      fontSize:   15,
    },
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  greetingCard: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.xl,
    marginBottom:    spacing.md,
    marginTop:       spacing.base,
    ...shadows.card,
  },
  dateLabel: {
    fontFamily:    fonts.sans,
    fontSize:      fontSizes.xs,
    color:         colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom:  spacing.sm,
  },
  greeting: {
    fontFamily:   fonts.serif,
    fontSize:     fontSizes['2xl'],
    color:        colors.textPrimary,
    fontWeight:   '700',
    marginBottom: spacing.xs,
  },
  greetingSub: {
    fontFamily: fonts.cursive,
    fontSize:   fontSizes.md,
    color:      colors.textSecondary,
    fontStyle:  'italic',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    marginBottom:    spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    marginBottom: spacing.base,
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

  calendar: {
    borderRadius: borderRadius.md,
  },
  loader: {
    paddingVertical: spacing['2xl'],
  },

  legend: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     spacing.base,
    gap:           spacing.xs,
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
});
