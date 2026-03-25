// DatePickerInput — tappable field that opens a calendar modal.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { format } from 'date-fns';

type Props = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  maxDate?: string;
};

export function DatePickerInput({
  label,
  value,
  onChange,
  placeholder = 'tap to pick a date',
  maxDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const displayValue = value
    ? format(new Date(value + 'T00:00:00'), 'dd MMM yyyy')
    : '';

  function handleDayPress(day: { dateString: string }) {
    onChange(day.dateString);
    setOpen(false);
  }

  const markedDates = value
    ? { [value]: { selected: true, selectedColor: colors.accentBlue } }
    : {};

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.field, open && styles.fieldFocused]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{label}</Text>

            <Calendar
              current={value || today}
              maxDate={maxDate || today}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={calendarTheme}
              enableSwipeMonths
            />

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const calendarTheme = {
  backgroundColor:            colors.surfaceAlt,
  calendarBackground:         colors.surfaceAlt,
  textSectionTitleColor:      colors.textMuted,
  selectedDayBackgroundColor: colors.accentBlue,
  selectedDayTextColor:       colors.white,
  todayTextColor:             colors.accentBlue,
  todayBackgroundColor:       'transparent',
  dayTextColor:               colors.textPrimary,
  textDisabledColor:          colors.textMuted,
  dotColor:                   colors.accent,
  selectedDotColor:           colors.white,
  arrowColor:                 colors.accentBlue,
  monthTextColor:             colors.textPrimary,
  textMonthFontFamily:        fonts.sans,
  textDayFontFamily:          fonts.sans,
  textDayHeaderFontFamily:    fonts.sans,
  textMonthFontSize:          15,
  textDayFontSize:            13,
  textDayHeaderFontSize:      11,
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.base,
  },
  label: {
    color:         colors.textSecondary,
    fontFamily:    fonts.sans,
    fontSize:      fontSizes.sm,
    marginBottom:  spacing.xs + 2,
    fontWeight:    '500',
    letterSpacing: 0.3,
  },
  field: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   colors.inputBg,
    borderWidth:       1,
    borderColor:       colors.inputBorder,
    borderRadius:      borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.md,
    minHeight:         50,
  },
  fieldFocused: {
    borderColor: colors.inputFocusBorder,
  },
  fieldText: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.base,
    color:      colors.inputText,
    flex:       1,
  },
  placeholder: {
    color: colors.inputPlaceholder,
  },
  icon: {
    fontSize:   18,
    marginLeft: spacing.sm,
  },
  overlay: {
    flex:            1,
    backgroundColor: colors.overlay,
    justifyContent:  'center',
    alignItems:      'center',
    padding:         spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    width:           '100%',
    ...shadows.strong,
  },
  modalTitle: {
    fontFamily:    fonts.sans,
    fontSize:      fontSizes.base,
    color:         colors.textSecondary,
    fontWeight:    '600',
    letterSpacing: 0.3,
    marginBottom:  spacing.base,
    textAlign:     'center',
  },
  cancelBtn: {
    marginTop:      spacing.base,
    paddingVertical: spacing.md,
    alignItems:     'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelText: {
    fontFamily:    fonts.sans,
    fontSize:      fontSizes.sm,
    color:         colors.textMuted,
    letterSpacing: 0.5,
  },
});
