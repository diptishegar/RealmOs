// Reusable Button — royal premium style with scale micro-interaction.
// Supports 'primary' (filled accent), 'ghost' (outlined), and 'danger' variants.

import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing, shadows, animation } from '@/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: animation.fast,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: animation.fast,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          isPrimary && styles.primary,
          variant === 'ghost' && styles.ghost,
          isDanger && styles.danger,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={isPrimary ? colors.textOnAccent : isDanger ? colors.white : colors.accentBlue}
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.label,
              isPrimary && styles.labelPrimary,
              variant === 'ghost' && styles.labelGhost,
              isDanger && styles.labelDanger,
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: {
    backgroundColor: colors.accentBlue,
    ...shadows.card,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accentBlue,
  },
  danger: {
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelPrimary: {
    color: colors.textOnAccent,
  },
  labelGhost: {
    color: colors.accentBlue,
  },
  labelDanger: {
    color: colors.white,
  },
});
