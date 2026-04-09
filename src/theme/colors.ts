export const colors = {
  // Primary — calm teal (matches logo)
  primary: '#4A9BAD',
  primaryLight: '#6DB8C8',
  primaryDark: '#3A7A8C',

  // Secondary — soft sage green
  secondary: '#7BC67E',
  secondaryLight: '#A3D9A5',
  secondaryDark: '#5AA05D',

  // Accents
  accent: '#F5A623',
  accentLight: '#FFCA6A',
  accentDark: '#D48A00',
  accent2: '#5C6BC0', // soft indigo for data/insights

  // Semantic
  error: '#EF5350',
  errorLight: '#FFCDD2',
  warning: '#FFA726',
  success: '#66BB6A',
  info: '#42A5F5',

  // Backgrounds — clean white with subtle warmth
  background: '#F5F8FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EDF2F5',

  // Text — dark navy for readability
  textPrimary: '#1E3A4F',
  textSecondary: '#607D8B',
  textDisabled: '#B0BEC5',
  textOnPrimary: '#FFFFFF',
  textOnGradient: '#FFFFFF',

  // Borders — cool gray
  border: '#D6E0E5',
  divider: '#E8EEF1',

  // Gradients — teal matching logo
  gradientStart: '#5A9FB2',
  gradientEnd: '#3A7A8C',

  // Log type colors — bold & vibrant
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
