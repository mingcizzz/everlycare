import React, { useRef } from 'react';
import { Pressable, StyleSheet, ViewStyle, ColorValue, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, borderRadius, shadows, spacing, typography } from '../../theme';

type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

interface GradientCardProps {
  gradientColors?: GradientColors;
  style?: ViewStyle;
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function GradientCard({
  gradientColors = [colors.gradientStart, colors.gradientEnd] as GradientColors,
  style,
  children,
  onPress,
  onLongPress,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={gradientColors}
          start={start}
          end={end}
          style={[styles.card, shadows.md, style]}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  gradientColors?: GradientColors;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GradientButton({
  label,
  onPress,
  gradientColors = [colors.gradientStart, colors.gradientEnd] as GradientColors,
  icon,
  loading = false,
  disabled = false,
  style,
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={disabled ? ['#BDBDBD', '#9E9E9E'] as GradientColors : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, shadows.sm, style]}
        >
          {loading ? (
            <ActivityIndicator size={20} color={colors.textOnGradient} />
          ) : (
            <>
              {icon && (
                <MaterialCommunityIcons
                  name={icon as any}
                  size={20}
                  color={colors.textOnGradient}
                  style={styles.buttonIcon}
                />
              )}
              <Text style={styles.buttonLabel}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  button: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonLabel: {
    ...typography.subtitle,
    color: colors.textOnGradient,
  },
});
