// Reusable Input — clean, modern, premium feel on light backgrounds.

import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors, fonts, fontSizes, spacing, borderRadius, animation } from '@/theme';

type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
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
  maxLength,
  style,
  error,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: animation.normal,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: animation.normal,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.inputBorder, colors.inputFocusBorder],
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[
        styles.inputWrapper,
        { borderColor: error ? colors.error : animatedBorderColor },
        focused && styles.inputWrapperFocused,
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
          ]}
        />
      </Animated.View>
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
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    backgroundColor: colors.white,
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    color: colors.inputText,
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 50,
    lineHeight: 22,
    borderRadius: borderRadius.md,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
