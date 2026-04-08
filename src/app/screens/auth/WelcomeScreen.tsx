import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GradientButton } from '../../../components/ui/GradientCard';
import { colors, spacing, typography, borderRadius } from '../../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    key: 'welcome',
    icon: 'heart-pulse',
    titleKey: 'onboarding.welcome',
    descKey: 'onboarding.welcomeDesc',
    gradientColors: [colors.primary + '30', colors.primary + '10'],
    iconColor: colors.primary,
  },
  {
    key: 'track',
    icon: 'notebook-edit-outline',
    titleKey: 'onboarding.track',
    descKey: 'onboarding.trackDesc',
    gradientColors: [colors.secondary + '30', colors.secondary + '10'],
    iconColor: colors.secondary,
  },
  {
    key: 'analyze',
    icon: 'chart-line',
    titleKey: 'onboarding.analyze',
    descKey: 'onboarding.analyzeDesc',
    gradientColors: [colors.accent2 + '30', colors.accent2 + '10'],
    iconColor: colors.accent2,
  },
  {
    key: 'together',
    icon: 'account-group',
    titleKey: 'onboarding.together',
    descKey: 'onboarding.togetherDesc',
    gradientColors: [colors.info + '30', colors.info + '10'],
    iconColor: colors.info,
  },
];

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const renderSlide = ({ item }: { item: (typeof SLIDES)[number] }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradientColors as [string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.iconCircle}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={80}
          color={item.iconColor}
        />
      </LinearGradient>
      <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
      <Text style={styles.slideDesc}>{t(item.descKey)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(
            Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          );
        }}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => {
          const inputRange = [
            (i - 1) * SCREEN_WIDTH,
            i * SCREEN_WIDTH,
            (i + 1) * SCREEN_WIDTH,
          ];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity: dotOpacity },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.bottomRow}>
        {!isLast && (
          <Button
            mode="text"
            onPress={onComplete}
            textColor={colors.textSecondary}
          >
            Skip
          </Button>
        )}
        <View style={{ flex: 1 }} />
        <GradientButton
          label={isLast ? t('onboarding.getStarted') : t('common.next')}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  slideTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  nextButton: {
    minWidth: 120,
  },
});
