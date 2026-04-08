import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.accent,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    onPrimary: colors.textOnPrimary,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
  },
};

export { colors, spacing, borderRadius, typography };
