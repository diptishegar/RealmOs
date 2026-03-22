// LoginScreen — username + PIN sign-in with inline validation.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { authService } from '@/services/authService';
import { useApp } from '@/store/AppContext';

type Props = {
  onBack: () => void;
  onGoogleSignIn: () => void;
  onForgotPassword: () => void;
};

type FieldErrors = {
  username?: string;
  password?: string;
};

export function LoginScreen({ onBack, onGoogleSignIn, onForgotPassword }: Props) {
  const { setUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!username.trim()) {
      errs.username = 'Username is required.';
    }
    if (!password) {
      errs.password = 'PIN is required.';
    }
    return errs;
  }

  async function handleLogin() {
    setSubmitError('');
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const result = await authService.login(username.trim().toLowerCase(), password);
      await setUser({
        id:          result.user.id,
        name:        result.user.name,
        username:    result.user.username,
        onboarded:   result.user.onboarded,
        token:       result.token,
        tokenExpiry: result.token_expiry,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Incorrect username or PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearFieldError(field: keyof FieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>

        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.sub}>Welcome back.</Text>

          <Input
            label="Username"
            value={username}
            onChangeText={(v) => { setUsername(v); clearFieldError('username'); }}
            placeholder="your_username"
            maxLength={30}
            error={fieldErrors.username}
          />
          <Input
            label="PIN"
            value={password}
            onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
            placeholder="Your PIN"
            secureTextEntry
            keyboardType="numeric"
            maxLength={8}
            error={fieldErrors.password}
          />

          <TouchableOpacity onPress={onForgotPassword} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
          />

          {submitError ? (
            <Text style={styles.submitError}>{submitError}</Text>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={onGoogleSignIn} activeOpacity={0.85}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleLabel}>Continue with Google</Text>
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
  backRow: {
    marginBottom: spacing.base,
  },
  backText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.deepPurple,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.card,
  },
  title: {
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
    marginBottom: spacing.xl,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.base,
  },
  forgotText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.deepPurple,
    fontWeight: '600',
  },
  submitError: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: '#B91C1C',
    marginTop: spacing.sm,
    textAlign: 'center',
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
});
