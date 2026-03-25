// NumericInput — input with range validation.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  placeholder?: string;
  min: number;
  max: number;
  decimal?: boolean;
  unit?: string;
};

export function NumericInput({
  label,
  value,
  onChangeText,
  placeholder,
  min,
  max,
  decimal = false,
  unit,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const num = parseFloat(value);
  const hasValue = value.trim() !== '';
  const isInvalid = touched && hasValue && (isNaN(num) || num < min || num > max);

  function handleChange(text: string) {
    const cleaned = decimal
      ? text.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1')
      : text.replace(/[^0-9]/g, '');
    onChangeText(cleaned);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{min}–{max}{unit ? ` ${unit}` : ''}</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setTouched(true); }}
        placeholder={placeholder ?? `${min}–${max}`}
        placeholderTextColor={colors.inputPlaceholder}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        style={[
          styles.input,
          focused && styles.focused,
          isInvalid && styles.invalid,
        ]}
      />

      {isInvalid && (
        <Text style={styles.error}>
          must be between {min} and {max}{unit ? ` ${unit}` : ''} 🙈
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.base,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    color: colors.inputText,
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  focused: {
    borderColor: colors.inputFocusBorder,
  },
  invalid: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
