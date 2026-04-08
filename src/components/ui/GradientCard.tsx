import React from 'react';
import { Pressable, StyleSheet, ViewStyle, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, borderRadius, shadows, spacing, typography } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
    >
      <LinearGradient
        colors={gradientColors}
        start={start}
        end={end}
        style={[styles.card, shadows.md, style]}
      >
        {children}
      </LinearGradient>
    </AnimatedPressable>
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
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
                name={icon}
                size={20}
                color={colors.textOnGradient}
                style={styles.buttonIcon}
              />
            )}
            <Text style={styles.buttonLabel}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
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
