// SignupScreen — username + PIN signup with email + goals selection.
// PIN must be 4–6 digits (numeric). Goals are multi-select chips.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { authService } from '@/services/authService';
import { useApp } from '@/store/AppContext';

// Goals from auth spec — what the user wants to track
const GOAL_OPTIONS = [
  { key: 'health',   label: '🌿 Health'   },
  { key: 'fitness',  label: '💪 Fitness'  },
  { key: 'hormones', label: '🧬 Hormones' },
  { key: 'periods',  label: '🩸 Periods'  },
  { key: 'skin',     label: '✨ Skin'     },
  { key: 'hair',     label: '💇 Hair'     },
];

type Props = {
  onBack: () => void;
  onGoogleSignUp: () => void;
};

type FieldErrors = {
  username?: string;
  name?: string;
  pin?: string;
  confirmPin?: string;
  email?: string;
  goals?: string;
};

export function SignupScreen({ onBack, onGoogleSignUp }: Props) {
  const { setUser } = useApp();
  const [username, setUsername]       = useState('');
  const [name, setName]               = useState('');
  const [pin, setPin]                 = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [email, setEmail]             = useState('');
  const [goals, setGoals]             = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  function toggleGoal(key: string) {
    setGoals((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
    clearFieldError('goals');
  }

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

    if (!/^\d{4,6}$/.test(pin)) {
      errs.pin = 'PIN must be 4–6 digits.';
    }

    if (!confirmPin) {
      errs.confirmPin = 'Please confirm your PIN.';
    } else if (pin !== confirmPin) {
      errs.confirmPin = 'PINs do not match.';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (goals.length === 0) {
      errs.goals = 'Pick at least one goal to track.';
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
        pin,
        confirm_pin: confirmPin,
        email: email.trim() || undefined,
        goals,
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
            Pick a username, set a PIN, and choose what you want to track.
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
            label="PIN (4–6 digits)"
            value={pin}
            onChangeText={(v) => { setPin(v); clearFieldError('pin'); }}
            placeholder="e.g. 1234"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            error={fieldErrors.pin}
          />
          <Input
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={(v) => { setConfirmPin(v); clearFieldError('confirmPin'); }}
            placeholder="Repeat PIN"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            error={fieldErrors.confirmPin}
          />
          <Input
            label="Email (optional — for PIN recovery)"
            value={email}
            onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={fieldErrors.email}
          />

          {/* Goals multi-select */}
          <Text style={styles.goalsLabel}>What do you want to track?</Text>
          <View style={styles.chipRow}>
            {GOAL_OPTIONS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.chip, goals.includes(key) && styles.chipActive]}
                onPress={() => toggleGoal(key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, goals.includes(key) && styles.chipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {fieldErrors.goals ? (
            <Text style={styles.goalsError}>{fieldErrors.goals}</Text>
          ) : null}

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
    color: colors.accentBlue,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.card,
  },
  title: {
    fontFamily: fonts.serif,
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
  goalsLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  chipActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.accentBlue,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  goalsError: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: -spacing.base,
    marginBottom: spacing.base,
  },
  submitError: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.error,
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
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 50,
    shadowColor: colors.royalDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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
    color: colors.royalDark,
    letterSpacing: 0.2,
  },
});
