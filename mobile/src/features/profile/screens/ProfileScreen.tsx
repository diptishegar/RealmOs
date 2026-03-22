// ProfileScreen — user info and account settings.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { useApp } from '@/store/AppContext';

export function ProfileScreen() {
  const { state, dispatch } = useApp();
  const [logoutPressed, setLogoutPressed] = useState(false);

  const name     = state.user?.name     ?? '—';
  const username = state.user?.username ?? '—';

  // Dispatch CLEAR_USER synchronously — this is the most direct logout path.
  // AsyncStorage cleanup runs in the background afterward.
  function handleLogout() {
    dispatch({ type: 'CLEAR_USER' });
    AsyncStorage.removeItem('app_user').catch(() => {});
  }

  return (
    <ScreenWrapper scrollable>

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.username}>@{username}</Text>
      </View>

      {/* ── Settings placeholder card ─────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Text style={styles.comingSoon}>More options coming soon ✨</Text>
      </View>

      {/* ── Logout button — red outline → solid red on press ─────────────── */}
      <TouchableOpacity
        onPress={handleLogout}
        onPressIn={() => setLogoutPressed(true)}
        onPressOut={() => setLogoutPressed(false)}
        activeOpacity={1}
        style={[styles.logoutBtn, logoutPressed && styles.logoutBtnActive]}
      >
        <Text style={[styles.logoutText, logoutPressed && styles.logoutTextActive]}>
          Logout
        </Text>
      </TouchableOpacity>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    marginBottom:    spacing.md,
    alignItems:      'center',
    ...shadows.card,
  },

  avatarCircle: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: colors.deepPurple,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.base,
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xl,
    fontWeight: '700',
    color:      colors.white,
  },

  name: {
    fontFamily:   fonts.sans,
    fontSize:     fontSizes.lg,
    fontWeight:   '700',
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  username: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.sm,
    color:      colors.textSecondary,
  },

  sectionTitle: {
    fontFamily:   fonts.sans,
    fontSize:     fontSizes.base,
    fontWeight:   '700',
    color:        colors.textPrimary,
    alignSelf:    'flex-start',
    marginBottom: spacing.sm,
  },
  comingSoon: {
    fontFamily: fonts.cursive,
    fontSize:   fontSizes.sm,
    color:      colors.textMuted,
    fontStyle:  'italic',
    alignSelf:  'flex-start',
  },

  // Logout button — red outline at rest, solid red on press
  logoutBtn: {
    borderWidth:     1.5,
    borderColor:     '#C0392B',
    borderRadius:    borderRadius.full,
    paddingVertical: spacing.md,
    alignItems:      'center',
    marginTop:       spacing.base,
    marginBottom:    spacing['2xl'],
    backgroundColor: 'transparent',
  },
  logoutBtnActive: {
    backgroundColor: '#C0392B',
  },
  logoutText: {
    fontFamily:    fonts.sans,
    fontSize:      fontSizes.base,
    fontWeight:    '600',
    color:         '#C0392B',
    letterSpacing: 0.3,
  },
  logoutTextActive: {
    color: colors.white,
  },
});
