import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'PingFang SC',
    bold: 'PingFang SC',
    mono: 'SF Mono',
  },
  android: {
    regular: 'sans-serif',
    bold: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: {
    regular: 'System',
    bold: 'System',
    mono: 'monospace',
  },
});

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    fontFamily: fontFamily?.bold,
  } as TextStyle,

  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    fontFamily: fontFamily?.bold,
  } as TextStyle,

  h3: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    fontFamily: fontFamily?.bold,
  } as TextStyle,

  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    fontFamily: fontFamily?.bold,
  } as TextStyle,

  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontFamily: fontFamily?.regular,
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: fontFamily?.regular,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: fontFamily?.regular,
  } as TextStyle,

  data: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    fontFamily: fontFamily?.mono,
  } as TextStyle,

  dataLarge: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    fontFamily: fontFamily?.mono,
  } as TextStyle,

  dataXL: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    fontFamily: fontFamily?.mono,
  } as TextStyle,
} as const;
