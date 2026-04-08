export const colors = {
  primary: '#4A90A4',
  primaryLight: '#6BAFC4',
  primaryDark: '#357080',

  secondary: '#7BC67E',
  secondaryLight: '#A3D9A5',
  secondaryDark: '#5AA05D',

  accent: '#F5A623',
  accentLight: '#FFCA6A',
  accentDark: '#D48A00',

  error: '#E74C3C',
  errorLight: '#F5A0A0',

  warning: '#F39C12',
  success: '#27AE60',
  info: '#3498DB',

  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F2F5',

  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textDisabled: '#BDC3C7',
  textOnPrimary: '#FFFFFF',

  border: '#E8EAED',
  divider: '#ECEFF1',

  // Log type colors
  logBowel: '#8B6914',
  logUrination: '#2980B9',
  logMeal: '#E67E22',
  logMedication: '#9B59B6',
  logMood: '#F1C40F',
  logHygiene: '#1ABC9C',
  logActivity: '#E74C3C',
  logNote: '#95A5A6',
} as const;

export type ColorToken = keyof typeof colors;
