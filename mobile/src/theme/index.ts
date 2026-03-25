// RealmOs Theme System — Royal Premium Edition
// Luxury dashboard aesthetic: calm, elegant, minimal.
// Import this anywhere: import { colors, fonts, spacing } from '@/theme';

export const colors = {
  // ─── Brand palette (from design PDF) ──────────────────────────────────────
  royalDark:   '#04080F',   // primary dark — deep royal base
  accentBlue:  '#507DBC',   // accent blue — buttons, links, active states
  softBlue:    '#A1C6EA',   // soft highlight — selected states, subtle emphasis
  secondaryBg: '#BBD1EA',   // secondary background — card hover, elevated surfaces
  alabaster:   '#DAE3E5',   // MAIN BACKGROUND — alabaster grey

  // ─── Semantic aliases ─────────────────────────────────────────────────────
  background:    '#DAE3E5',   // alabaster — main app background
  surface:       '#FFFFFF',   // white cards on alabaster
  surfaceAlt:    '#F0F4F6',   // slightly elevated surface (modals, date pickers)
  border:        '#C4CDD5',   // subtle border — slightly darker than background
  borderLight:   '#DAE3E5',   // very subtle border
  accent:        '#507DBC',   // accent blue
  textPrimary:   '#04080F',   // royal dark — headings, body text on light
  textSecondary: '#3A4A5C',   // dark slate — secondary text on light
  textMuted:     '#7A8B9C',   // muted grey — hints, labels
  textOnDark:    '#F0F4F6',   // light text on dark backgrounds
  textOnAccent:  '#FFFFFF',   // white text on accent blue

  // ─── Input-specific ───────────────────────────────────────────────────────
  inputBg:           '#F0F4F6',
  inputBorder:       '#C4CDD5',
  inputFocusBorder:  '#507DBC',
  inputText:         '#04080F',
  inputPlaceholder:  '#93A3B5',

  // ─── Status colors ────────────────────────────────────────────────────────
  success:  '#2D9F6F',
  warning:  '#D4A017',
  error:    '#C0392B',
  info:     '#507DBC',

  // ─── Period tracker — muted elegant tones ─────────────────────────────────
  periodLight:  '#D4A0B9',   // soft mauve
  periodMedium: '#B5739D',   // muted rose
  periodHeavy:  '#8B4573',   // deep plum
  periodSpot:   '#E0C4D4',   // pale blush

  // ─── Overlays ─────────────────────────────────────────────────────────────
  overlay: 'rgba(4, 8, 15, 0.6)',
  white:   '#FFFFFF',
  black:   '#000000',
} as const;

export const fonts = {
  // Serif — headings (royal/elegant feel)
  serif:       'System',       // TODO: load Playfair Display via expo-font

  // Sans-serif — body text (clean modern feel)
  sans:        'System',       // system default (San Francisco / Roboto)

  // Monospace — data/stats display
  mono:        'SpaceMono',

  // Cursive — quotes and highlights
  cursive:     'DancingScript',

  // Fallbacks
  monoFallback:    'Courier New',
  cursiveFallback: 'serif',
} as const;

export const fontSizes = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    17,
  lg:    20,
  xl:    24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
} as const;

export const fontWeights = {
  normal:    '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
} as const;

export const spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const borderRadius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
} as const;

// Reusable shadows — soft and premium, never harsh
export const shadows = {
  card: {
    shadowColor: '#04080F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#04080F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  strong: {
    shadowColor: '#04080F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Animation durations — consistent micro-interactions
export const animation = {
  fast:   120,
  normal: 220,
  slow:   400,
} as const;

const theme = { colors, fonts, fontSizes, fontWeights, spacing, borderRadius, shadows, animation };
export default theme;
