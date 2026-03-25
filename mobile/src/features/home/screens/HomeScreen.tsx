// HomeScreen — daily overview with quick stats and greeting.

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/theme';
import { useApp } from '@/store/AppContext';
import { format } from 'date-fns';

export function HomeScreen() {
  const { state } = useApp();
  const name = state.user?.name ?? 'gorgeous';
  const today = format(new Date(), 'EEEE, MMM d');

  return (
    <ScreenWrapper scrollable>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.greeting}>hey {name} ✨</Text>
        <Text style={styles.greetingSubtitle}>what are we tracking today?</Text>
      </View>

      {/* Quick stat cards */}
      <View style={styles.cardGrid}>
        <StatCard emoji="💧" label="water" value="— L" sublabel="goal: 3L" />
        <StatCard emoji="🏃" label="steps" value="—" sublabel="goal: 6000" />
        <StatCard emoji="😴" label="sleep" value="— hrs" sublabel="goal: 8h" />
        <StatCard emoji="🥗" label="protein" value="— g" sublabel="goal: 50g" />
      </View>

      {/* Section: Today's entries */}
      <Text style={styles.sectionTitle}>today at a glance</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🌙</Text>
        <Text style={styles.emptyText}>nothing logged yet.</Text>
        <Text style={styles.emptySubtext}>hit Track to get started babe 🚀</Text>
      </View>
    </ScreenWrapper>
  );
}

function StatCard({ emoji, label, value, sublabel }: {
  emoji: string; label: string; value: string; sublabel: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardSublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  date: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  greetingSubtitle: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    width: '47%',
    alignItems: 'center',
    ...shadows.card,
  },
  cardEmoji: { fontSize: 28, marginBottom: spacing.xs },
  cardLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.lg,
    color: colors.accentBlue,
    fontWeight: '700',
  },
  cardSublabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.base,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.base },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
  },
  emptySubtext: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
