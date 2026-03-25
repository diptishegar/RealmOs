// ForgotPasswordScreen — OTP-based PIN reset.
//
// Flow:
//   Step 1 (request): Enter username → backend generates OTP → (dev: shown on screen)
//   Step 2 (verify):  Enter 6-digit OTP + new PIN + confirm
//   Step 3 (done):    Success message → navigate to Login

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { authService } from '@/services/authService';

type Props = {
  onBack: () => void;
  onDone: () => void; // navigate back to login after success
};

type Step = 'request' | 'reset';

export function ForgotPasswordScreen({ onBack, onDone }: Props) {
  const [step, setStep]             = useState<Step>('request');
  const [username, setUsername]     = useState('');
  const [otp, setOtp]               = useState('');
  const [devOtp, setDevOtp]         = useState(''); // only set in dev builds
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading]       = useState(false);

  // ─── Step 1: Request OTP ──────────────────────────────────────────────────

  async function handleRequest() {
    if (!username.trim()) {
      Alert.alert('Missing username', 'Please enter your username.');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.forgotPIN(username.trim().toLowerCase());
      if (res.otp) {
        // Dev mode — OTP returned in response body
        setDevOtp(res.otp);
        setOtp(res.otp);
      }
      setStep('reset');
    } catch {
      // Always move to step 2 — never reveal if username exists
      setStep('reset');
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2: Verify OTP + Set New PIN ────────────────────────────────────

  async function handleReset() {
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit code from your message.');
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'New PIN must be 4–6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('PINs do not match', 'Please make sure both PINs match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPIN(username.trim().toLowerCase(), otp.trim(), newPin);
      Alert.alert(
        'PIN reset!',
        'You can now log in with your new PIN.',
        [{ text: 'Log In', onPress: onDone }],
      );
    } catch (err: any) {
      Alert.alert('Reset failed', err.message || 'OTP may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>

        <TouchableOpacity
          onPress={step === 'reset' ? () => setStep('request') : onBack}
          style={styles.backRow}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>

          {step === 'request' ? (
            <>
              <Text style={styles.title}>Forgot PIN?</Text>
              <Text style={styles.sub}>
                Enter your username and we'll send a one-time code to reset your PIN.
              </Text>

              <Input
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="your_username"
                maxLength={30}
              />

              <Button
                label="Send OTP"
                onPress={handleRequest}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Reset PIN</Text>
              <Text style={styles.sub}>
                Enter the 6-digit code sent to you, then choose a new PIN.
              </Text>

              {/* Dev mode: show OTP on screen for testing */}
              {devOtp ? (
                <View style={styles.devBanner}>
                  <Text style={styles.devLabel}>Dev mode — one-time code</Text>
                  <Text style={styles.devOtp} selectable>{devOtp}</Text>
                </View>
              ) : null}

              <Input
                label="6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                placeholder="e.g. 123456"
                keyboardType="numeric"
                maxLength={6}
              />
              <Input
                label="New PIN (4–6 digits)"
                value={newPin}
                onChangeText={setNewPin}
                placeholder="e.g. 9999"
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
              />
              <Input
                label="Confirm New PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Repeat PIN"
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
              />

              <Button
                label="Set New PIN"
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
  devOtp: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xl,
    color: colors.deepPurple,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
