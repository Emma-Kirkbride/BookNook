
import { Platform, StyleSheet } from 'react-native';

export const fonts = {
  // Primary font family for body text
  primary: Platform.select({
    ios: 'Avenir',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Secondary font for headers/titles
  secondary: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  
  // Monospace for code or special elements
  monospace: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
  
  //add custom fonts via Expo Google Fonts
  custom: {
    crimsonText: 'CrimsonText_400Regular',
    crimsonTextSemiBold: 'CrimsonText_600SemiBold',
    inter: 'Inter_400Regular',
    interMedium: 'Inter_500Medium',
    interSemiBold: 'Inter_600SemiBold',
    interBold: 'Inter_700Bold',
  }
};

// Typography scale
export const typography = StyleSheet.create({
  // Headers
  h1: {
    fontFamily: fonts.secondary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fonts.secondary,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fonts.primary,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  // Body text
  body: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  // Special text styles
  caption: {
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  overline: {
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  
  // Button text
  button: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // BookNook specific styles
  bookTitle: {
    fontFamily: fonts.secondary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  authorName: {
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quote: {
    fontFamily: fonts.secondary,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  pageNumber: {
    fontFamily: fonts.monospace,
    fontSize: 12,
    fontWeight: '400',
  },
});

// Color combinations for different text types
export const textColors = {
  primary: '#1F2937',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  accent: '#3B82F6',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  inverse: '#FFFFFF',
};

export default { fonts, typography, textColors };