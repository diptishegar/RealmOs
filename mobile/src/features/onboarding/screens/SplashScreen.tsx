// SplashScreen — shown on every app launch.
// Fetches a random motivational quote, displays it in cursive, then navigates.
//
// REACT NATIVE LESSON:
//   Animated.Value is like a CSS transition but in JS.
//   We fade the quote in using Animated.timing + opacity.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, fontSizes, spacing } from '@/theme';
import { quoteService, Quote } from '@/services/quoteService';

const { width, height } = Dimensions.get('window');

type Props = {
  onDone: () => void; // called after splash finishes
};

export function SplashScreen({ onDone }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fetch quote from backend (falls back to static if API is down)
    quoteService.getRandom()
      .then(setQuote)
      .catch(() => {
        setQuote({
          id: 'fallback',
          text: 'She remembered who she was and the game changed.',
          author: 'Lalah Delia',
          category: 'power',
        });
      });
  }, []);

  useEffect(() => {
    if (!quote) return;

    // Fade in + slide up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate after 3 seconds
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [quote, fadeAnim, slideAnim, onDone]);

  return (
    <View style={styles.container}>
      {/* App name */}
      <Text style={styles.appName}>RealmOs</Text>
      <Text style={styles.tagline}>your life. your data. your realm.</Text>

      {/* Quote area */}
      {!quote ? (
        <ActivityIndicator color={colors.crystalBlue} style={styles.loader} />
      ) : (
        <Animated.View
          style={[
            styles.quoteContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          {quote.author ? (
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          ) : null}
        </Animated.View>
      )}

      {/* Bottom glow effect */}
      <View style={styles.bottomGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  appName: {
    fontFamily: fonts.mono,
    fontSize: fontSizes['3xl'],
    color: colors.crystalBlue,
    letterSpacing: 4,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing['4xl'],
  },
  loader: {
    marginTop: spacing['2xl'],
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  quoteText: {
    // Cursive font for quotes — app personality requirement
    fontFamily: fonts.cursive,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: spacing.base,
  },
  quoteAuthor: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: height * 0.15,
    backgroundColor: colors.accent,
    opacity: 0.06,
  },
});
