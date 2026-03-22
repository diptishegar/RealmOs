// WelcomeScreen — sign in with Google SSO or PIN.
// No guest access — all users must authenticate.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';

type Props = {
  onGoogleSignIn: () => void;
  onPinSignIn: () => void;
  onCreateAccount: () => void;
};

export function WelcomeScreen({ onGoogleSignIn, onPinSignIn, onCreateAccount }: Props) {
  return (
    <ScreenWrapper>
      <View style={styles.container}>

        {/* Brand block — on crystal canvas */}
        <View style={styles.brandBlock}>
          <Text style={styles.brandName}>RealmOs</Text>
          <Text style={styles.tagline}>Your personal health realm</Text>
        </View>

        {/* Auth card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Sign In</Text>
          <Text style={styles.sub}>
            Track your health, hormones, and habits — privately and securely.
          </Text>

          {/* Google SSO */}
          <TouchableOpacity style={styles.googleBtn} onPress={onGoogleSignIn} activeOpacity={0.85}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleLabel}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* PIN login */}
          <Button
            label="Sign In with PIN"
            onPress={onPinSignIn}
            style={styles.pinBtn}
          />

          {/* Create account link */}
          <TouchableOpacity onPress={onCreateAccount} style={styles.createRow}>
            <Text style={styles.createText}>
              New here?{' '}
              <Text style={styles.createLink}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing['2xl'],
  },

  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  brandName: {
    fontFamily: fonts.sans,
    fontSize: fontSizes['3xl'],
    fontWeight: '700',
    color: colors.deepPurple,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.base,
    color: colors.midPurple,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.card,
  },
  heading: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  // Google SSO button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
    marginBottom: spacing.base,
    shadowColor: colors.deepPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  googleIcon: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.deepPurple,
    letterSpacing: 0.2,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.base,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  pinBtn: {
    marginBottom: spacing.base,
  },

  createRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  createText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  createLink: {
    color: colors.deepPurple,
    fontWeight: '700',
  },
});
