export const colors = {
  primary: '#FF9E64',
  primaryLight: '#FFB88C',
  primaryDark: '#E8844A',

  secondary: '#4DB6AC',
  secondaryLight: '#80CBC4',
  secondaryDark: '#00897B',

  accent: '#FFB84D',
  accentLight: '#FFCA6A',
  accentDark: '#F5A623',
  accent2: '#7C4DFF',

  error: '#EF5350',
  errorLight: '#FFCDD2',
  warning: '#FFA726',
  success: '#66BB6A',
  info: '#42A5F5',

  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F0EB',

  textPrimary: '#1A237E',
  textSecondary: '#5C6BC0',
  textDisabled: '#9E9E9E',
  textOnPrimary: '#FFFFFF',
  textOnGradient: '#FFFFFF',

  border: '#E0D6CC',
  divider: '#EDE7E0',

  gradientStart: '#FF9E64',
  gradientEnd: '#F4A460',

  logBowel: '#8D6E63',
  logUrination: '#42A5F5',
  logMeal: '#FFA726',
  logMedication: '#AB47BC',
  logMood: '#FFC107',
  logHygiene: '#26C6DA',
  logActivity: '#EF5350',
  logNote: '#78909C',
} as const;

export const logGradients: Record<string, [string, string]> = {
  bowel: ['#8D6E63', '#A1887F'],
  urination: ['#42A5F5', '#64B5F6'],
  meal: ['#FFA726', '#FFB74D'],
  medication: ['#AB47BC', '#CE93D8'],
  mood: ['#FFC107', '#FFD54F'],
  hygiene: ['#26C6DA', '#4DD0E1'],
  activity: ['#EF5350', '#E57373'],
  note: ['#78909C', '#90A4AE'],
};

export type ColorToken = keyof typeof colors;
