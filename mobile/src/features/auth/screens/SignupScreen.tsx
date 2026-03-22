// SignupScreen — username + name + password signup with inline validation.

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
  onGoogleSignUp: () => void;
};

type FieldErrors = {
  username?: string;
  name?: string;
  password?: string;
  confirmPass?: string;
};

export function SignupScreen({ onBack, onGoogleSignUp }: Props) {
  const { setUser } = useApp();
  const [username, setUsername]       = useState('');
  const [name, setName]               = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    const u = username.trim().toLowerCase();

    if (u.length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    } else if (u.length > 30) {
      errs.username = 'Username cannot exceed 30 characters.';
    } else if (!/^[a-z0-9_]+$/.test(u)) {
      errs.username = 'Only letters, numbers, and underscores allowed.';
    }

    if (!name.trim()) {
      errs.name = 'Display name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    } else if (password.length > 64) {
      errs.password = 'Password cannot exceed 64 characters.';
    }

    if (!confirmPass) {
      errs.confirmPass = 'Please confirm your password.';
    } else if (password !== confirmPass) {
      errs.confirmPass = 'Passwords do not match.';
    }

    return errs;
  }

  async function handleSignup() {
    setSubmitError('');
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const result = await authService.register({
        username: username.trim().toLowerCase(),
        name: name.trim(),
        password,
      });
      await setUser({
        id:          result.user.id,
        name:        result.user.name,
        username:    result.user.username,
        onboarded:   result.user.onboarded,
        token:       result.token,
        tokenExpiry: result.token_expiry,
      });
    } catch (err: any) {
      setSubmitError(err.message ?? 'Could not create account. Please try again.');
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
    <ScreenWrapper scrollable>
      <View style={styles.container}>

        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.sub}>
            Choose a unique username and set a password to get started.
          </Text>

          <Input
            label="Username"
            value={username}
            onChangeText={(v) => { setUsername(v); clearFieldError('username'); }}
            placeholder="e.g. dipti_queen"
            maxLength={30}
            error={fieldErrors.username}
          />
          <Input
            label="Display Name"
            value={name}
            onChangeText={(v) => { setName(v); clearFieldError('name'); }}
            placeholder="Your name"
            maxLength={50}
            error={fieldErrors.name}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
            placeholder="At least 8 characters"
            secureTextEntry
            maxLength={64}
            error={fieldErrors.password}
          />
          <Input
            label="Confirm Password"
            value={confirmPass}
            onChangeText={(v) => { setConfirmPass(v); clearFieldError('confirmPass'); }}
            placeholder="Repeat password"
            secureTextEntry
            maxLength={64}
            error={fieldErrors.confirmPass}
          />

          <Button
            label="Create Account"
            onPress={handleSignup}
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

          <TouchableOpacity style={styles.googleBtn} onPress={onGoogleSignUp} activeOpacity={0.85}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleLabel}>Sign up with Google</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
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
    lineHeight: 20,
    marginBottom: spacing.xl,
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
