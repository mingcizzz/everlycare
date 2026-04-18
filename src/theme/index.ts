import { MD3LightTheme } from 'react-native-paper';
import { colors, logGradients, logBackgrounds } from './colors';
import { spacing, borderRadius, shadows } from './spacing';
import { typography } from './typography';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.tertiary,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceSecondary,
    onPrimary: colors.textOnPrimary,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
  },
};

export { colors, logGradients, logBackgrounds, spacing, borderRadius, shadows, typography };
