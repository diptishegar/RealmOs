// ScreenWrapper: every screen gets this shell.
// Alabaster background, safe area, optional scroll.

import React, { ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

type ScreenWrapperProps = {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  dark?: boolean; // for splash/auth screens that need dark background
};

export function ScreenWrapper({
  children,
  scrollable = false,
  padded = true,
  dark = false,
}: ScreenWrapperProps) {
  const bg = dark ? colors.royalDark : colors.background;

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={padded ? styles.scrollContent : undefined}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.inner, padded && styles.padded]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
});
