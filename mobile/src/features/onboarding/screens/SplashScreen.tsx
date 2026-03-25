// SplashScreen — dramatic dark splash on every app launch.
// Fetches a random motivational quote, displays it in cursive, then navigates.

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

const FALLBACK_QUOTES: Quote[] = [
  { id: 'f1',  text: "I'd ruin the world gently, just to keep you safe.", author: null, category: 'dark' },
  { id: 'f2',  text: "You're my favorite bad decision.", author: null, category: 'dark' },
  { id: 'f3',  text: "I don't fix people—I keep them broken with me.", author: null, category: 'dark' },
  { id: 'f4',  text: "If loving you is chaos, I'll burn calmly.", author: null, category: 'dark' },
  { id: 'f5',  text: "You're the sin I'd confess twice.", author: null, category: 'dark' },
  { id: 'f6',  text: "We don't heal—we haunt each other softer.", author: null, category: 'dark' },
  { id: 'f7',  text: "I chose you knowing you'd destroy me beautifully.", author: null, category: 'dark' },
  { id: 'f8',  text: "Your darkness matches mine a little too perfectly.", author: null, category: 'dark' },
  { id: 'f9',  text: "I'd rather bleed with you than breathe without you.", author: null, category: 'dark' },
  { id: 'f10', text: "You're not good for me—that's why I stay.", author: null, category: 'dark' },
  { id: 'f11', text: "We were never meant to last, only to linger.", author: null, category: 'dark' },
  { id: 'f12', text: "You don't get to leave—you're mine even when you hate it.", author: null, category: 'dark' },
  { id: 'f13', text: "I don't share what I love. I guard it.", author: null, category: 'dark' },
  { id: 'f14', text: "If I can't have you gently, I'll have you completely.", author: null, category: 'dark' },
  { id: 'f15', text: "You were never an option—you were always the decision.", author: null, category: 'dark' },
  { id: 'f16', text: "I'd rather cage your heart than watch it wander.", author: null, category: 'dark' },
  { id: 'f17', text: "You belong to me in ways you don't understand yet.", author: null, category: 'dark' },
  { id: 'f18', text: "Love shouldn't feel safe—and with me, it won't.", author: null, category: 'dark' },
  { id: 'f19', text: "I don't chase. I claim.", author: null, category: 'dark' },
  { id: 'f20', text: "Even your freedom bends back to me.", author: null, category: 'dark' },
  { id: 'f21', text: "I'll ruin anyone who makes you forget me.", author: null, category: 'dark' },
  { id: 'f22', text: "You're not leaving—I'd break the world before I let you go.", author: null, category: 'dark' },
  { id: 'f23', text: "Your 'no' just sounds like a dare to me.", author: null, category: 'dark' },
  { id: 'f24', text: "I don't need permission to keep you.", author: null, category: 'dark' },
  { id: 'f25', text: "You're mine—even your silence answers to me.", author: null, category: 'dark' },
];

function getRandomFallback(): Quote {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
}

type Props = {
  onDone: () => void;
};

export function SplashScreen({ onDone }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    quoteService.getRandom()
      .then(setQuote)
      .catch(() => {
        setQuote(getRandomFallback());
      });
  }, []);

  useEffect(() => {
    if (!quote) return;

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

    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [quote, fadeAnim, slideAnim, onDone]);

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>RealmOs</Text>
      <Text style={styles.tagline}>your life. your data. your realm.</Text>

      {!quote ? (
        <ActivityIndicator color={colors.softBlue} style={styles.loader} />
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

      <View style={styles.bottomGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.royalDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  appName: {
    fontFamily: fonts.serif,
    fontSize: fontSizes['3xl'],
    color: colors.softBlue,
    letterSpacing: 4,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.secondaryBg,
    letterSpacing: 2,
    marginBottom: spacing['4xl'],
    opacity: 0.7,
  },
  loader: {
    marginTop: spacing['2xl'],
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  quoteText: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.xl,
    color: colors.textOnDark,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: spacing.base,
  },
  quoteAuthor: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.base,
    color: colors.softBlue,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: height * 0.15,
    backgroundColor: colors.accentBlue,
    opacity: 0.08,
  },
});
