// RealmOs Theme System
// All colors, fonts, and spacing in one place.
// Import this anywhere: import { colors, fonts, spacing } from '@/theme';

export const colors = {
  // Brand palette
  deepPurple:  '#36213E',   // background / darkest
  midPurple:   '#554971',   // card backgrounds
  slateBlue:   '#63768D',   // secondary text, borders
  skyBlue:     '#8AC6D0',   // icons, accents
  crystalBlue: '#B8F3FF',   // highlights, primary text on dark

  // Semantic aliases
  background:  '#36213E',
  surface:     '#554971',
  border:      '#63768D',
  accent:      '#8AC6D0',
  textPrimary: '#B8F3FF',
  textSecondary: '#8AC6D0',
  textMuted:   '#63768D',

  // Status colors
  success:  '#6FCF97',
  warning:  '#F2C94C',
  error:    '#EB5757',
  info:     '#8AC6D0',

  // Period tracker colors
  periodLight:  '#FFB3C1',
  periodMedium: '#FF758F',
  periodHeavy:  '#C9184A',
  periodSpot:   '#FFCCD5',

  // Transparent overlays
  overlay: 'rgba(54, 33, 62, 0.85)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const fonts = {
  // Sans-serif — used in auth screens for cleaner look
  sans:        'System',        // system default (San Francisco / Roboto)

  // Monospace — default for most UI
  mono:        'SpaceMono',     // load via expo-font

  // Cursive — for quotes and highlights
  cursive:     'DancingScript', // load via expo-font

  // Fallbacks (system fonts)
  monoFallback:    'Courier New',
  cursiveFallback: 'serif',
} as const;

export const fontSizes = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
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
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const borderRadius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

// Reusable shadow style for cards
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

const theme = { colors, fonts, fontSizes, fontWeights, spacing, borderRadius, shadows };
export default theme;
