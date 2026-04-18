export const colors = {
  // Primary — rich teal (premium, matches logo)
  primary: '#0D9488',
  primaryLight: '#E6F7F5',
  primaryDark: '#0A7B71',
  primaryMuted: '#0D948815',

  // Secondary — warm coral for accents
  secondary: '#FF7B6F',
  secondaryLight: '#FFF0EE',

  // Tertiary — soft purple for data/insights
  tertiary: '#7B68EE',
  tertiaryLight: '#F0EDFF',

  // Semantic
  error: '#E5534B',
  errorLight: '#FEF2F1',
  warning: '#F5A524',
  warningLight: '#FFF8EC',
  success: '#4CAF7D',
  successLight: '#EEFBF3',
  info: '#3B82F6',

  // Backgrounds — warm, premium
  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSecondary: '#F0F2F5',

  // Text — premium contrast
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textOnGradient: '#FFFFFF',

  // Borders & dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#F3F4F6',

  // Gradient
  gradientStart: '#2E8B9A',
  gradientEnd: '#1D6B78',
  gradientWarm: '#FF7B6F',

  // Log type — refined, cohesive palette
  logBowel: '#8B7355',
  logUrination: '#3B82F6',
  logMeal: '#F59E0B',
  logMedication: '#8B5CF6',
  logMood: '#EC4899',
  logHygiene: '#06B6D4',
  logActivity: '#EF4444',
  logNote: '#6B7280',
} as const;

export const logGradients: Record<string, [string, string]> = {
  bowel: ['#8B7355', '#A0896A'],
  urination: ['#3B82F6', '#60A5FA'],
  meal: ['#F59E0B', '#FBBF24'],
  medication: ['#8B5CF6', '#A78BFA'],
  mood: ['#EC4899', '#F472B6'],
  hygiene: ['#06B6D4', '#22D3EE'],
  activity: ['#EF4444', '#F87171'],
  note: ['#6B7280', '#9CA3AF'],
};

// Semantic card backgrounds (light tint of log color)
export const logBackgrounds: Record<string, string> = {
  bowel: '#F5F0EB',
  urination: '#EFF6FF',
  meal: '#FFFBEB',
  medication: '#F5F3FF',
  mood: '#FDF2F8',
  hygiene: '#ECFEFF',
  activity: '#FEF2F2',
  note: '#F9FAFB',
};

export type ColorToken = keyof typeof colors;
