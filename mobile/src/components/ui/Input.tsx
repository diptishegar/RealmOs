// Reusable Input component — monospace styled to match the app aesthetic.

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/theme';

type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  error?: string;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style,
  error,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && styles.inputFocused,
          multiline && styles.inputMultiline,
          error ? styles.inputError : undefined,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: fontSizes.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: colors.crystalBlue,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
