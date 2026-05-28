import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Brand Colors - Consistent across themes
export const brandColors = {
  primary: '#76d6d5',
  dark: '#5cb8b7',
  light: '#a3e5e4',
  dim: 'rgba(118, 214, 213, 0.6)',
  rgb: '118, 214, 213',
};

// Semantic Colors
export const semanticColors = {
  success: '#4ade80',
  successRgb: '74, 222, 128',
  warning: '#fbbf24',
  warningRgb: '251, 191, 36',
  error: '#f87171',
  errorRgb: '248, 113, 113',
  info: '#60a5fa',
  infoRgb: '96, 165, 250',
};

// Dark Theme
export const darkTheme = {
  name: 'dark',
  background: {
    primary: '#0e0e0e',
    secondary: '#1c1b1b',
    tertiary: '#242323',
    elevated: '#2a2a2a',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    primary: '#e5e2e1',
    secondary: '#879392',
    muted: '#6b7280',
    inverse: '#0e0e0e',
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.06)',
    secondary: 'rgba(255, 255, 255, 0.10)',
    elevated: 'rgba(255, 255, 255, 0.15)',
  },
  shadow: {
    small: '0 2px 8px rgba(0, 0, 0, 0.4)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.5)',
    large: '0 8px 32px rgba(0, 0, 0, 0.6)',
  },
  ...brandColors,
  ...semanticColors,
};

// Light Theme
export const lightTheme = {
  name: 'light',
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#f1f3f4',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  text: {
    primary: '#1a1a1a',
    secondary: '#4b5563',
    muted: '#6b7280',
    inverse: '#ffffff',
  },
  border: {
    primary: 'rgba(0, 0, 0, 0.08)',
    secondary: 'rgba(0, 0, 0, 0.12)',
    elevated: 'rgba(0, 0, 0, 0.16)',
  },
  shadow: {
    small: '0 2px 8px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
    large: '0 8px 32px rgba(0, 0, 0, 0.16)',
  },
  ...brandColors,
  ...semanticColors,
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'Manrope_400Regular',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
  sizes: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 56,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,
  },
};

// Spacing Scale (4px base)
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// Border Radius Scale
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Animation Config
export const animations = {
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  easing: {
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
  },
  spring: {
    gentle: { damping: 15, stiffness: 150 },
    normal: { damping: 10, stiffness: 100 },
    bouncy: { damping: 8, stiffness: 200 },
  },
};

// Shadow Styles (React Native compatible)
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  brand: {
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Status Colors Helper
export const getStatusColor = (status?: string): string => {
  if (!status) return darkTheme.text.secondary;
  
  const completedStatuses = ['completed', 'resolved_on_spot', 'delivered', 'approved'];
  const pendingStatuses = ['pending', 'hospital_broadcasted', 'ambulance_pinged', 'fundraiser_active'];
  const cancelledStatuses = ['cancelled', 'closed_unresolved', 'rejected'];
  
  if (completedStatuses.includes(status)) return semanticColors.success;
  if (pendingStatuses.includes(status)) return semanticColors.warning;
  if (cancelledStatuses.includes(status)) return semanticColors.error;
  return brandColors.primary;
};

export const getStatusBgColor = (status?: string): string => {
  const color = getStatusColor(status);
  // Convert hex to rgba with 10% opacity
  return `${color}1A`;
};

// Breakpoints
export const breakpoints = {
  phone: SCREEN_WIDTH,
  tablet: 768,
  desktop: 1024,
};

// Utility for screen dimensions
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
};
