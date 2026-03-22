// ForgotPasswordScreen — two-step: request reset token, then set new password.
// Dev mode: reset token is returned in the API response (shown in UI).

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { authService } from '@/services/authService';

type Props = {
  onBack: () => void;
  onDone: () => void;  // navigate back to login after success
};

type Step = 'request' | 'reset';

export function ForgotPasswordScreen({ onBack, onDone }: Props) {
  const [step, setStep]           = useState<Step>('request');
  const [email, setEmail]         = useState('');
  const [token, setToken]         = useState('');
  const [devToken, setDevToken]   = useState('');  // only set in dev builds
  const [password, setPassword]   = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleRequest() {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      if (res.reset_token) {
        // Dev mode — token returned in response
        setDevToken(res.reset_token);
        setToken(res.reset_token);
      }
      setStep('reset');
    } catch {
      // Always move to reset step — backend never reveals if email exists
      setStep('reset');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!token.trim()) {
      Alert.alert('Missing token', 'Enter the reset token from your email.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPass) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords match.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token.trim(), password);
      Alert.alert('Password updated', 'You can now log in with your new password.', [
        { text: 'Log In', onPress: onDone },
      ]);
    } catch (err: any) {
      Alert.alert('Reset failed', err.message || 'Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>

        <TouchableOpacity onPress={step === 'reset' ? () => setStep('request') : onBack} style={styles.backRow}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>

          {step === 'request' ? (
            <>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.sub}>
                Enter your account email and we'll send you a reset link.
              </Text>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />

              <Button
                label="Send Reset Link"
                onPress={handleRequest}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.sub}>
                Check your email for the reset token and enter it below.
              </Text>

              {devToken ? (
                <View style={styles.devBanner}>
                  <Text style={styles.devLabel}>Dev mode — reset token</Text>
                  <Text style={styles.devToken} selectable>{devToken}</Text>
                </View>
              ) : null}

              <Input
                label="Reset Token"
                value={token}
                onChangeText={setToken}
                placeholder="Paste your token here"
              />
              <Input
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                maxLength={64}
              />
              <Input
                label="Confirm New Password"
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Repeat password"
                secureTextEntry
                maxLength={64}
              />

              <Button
                label="Set New Password"
                onPress={handleReset}
                loading={loading}
              />
            </>
          )}

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

  devBanner: {
    backgroundColor: 'rgba(54, 33, 62, 0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  devLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  devToken: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.deepPurple,
    letterSpacing: 0.5,
  },
});
