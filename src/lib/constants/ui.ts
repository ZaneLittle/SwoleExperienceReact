// UI Constants for consistent styling across the app
export const LIGHT_COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    tertiary: '#3C3C4399',
    quaternary: '#3C3C4366',
  },
  border: '#C6C6C8',
  separator: '#C6C6C8',
} as const;

export const DARK_COLORS = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  background: '#1A1A1A',
  surface: '#2C2C2E',
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E7',
    tertiary: '#E5E5E799',
    quaternary: '#E5E5E766',
  },
  border: '#48484A',
  separator: '#48484A',
} as const;

export const COLORS = LIGHT_COLORS; // Default fallback

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
