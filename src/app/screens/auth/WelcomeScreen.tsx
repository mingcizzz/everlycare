import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, typography } from '../../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    key: 'welcome',
    icon: 'heart-pulse' as const,
    titleKey: 'onboarding.welcome',
    descKey: 'onboarding.welcomeDesc',
  },
  {
    key: 'track',
    icon: 'notebook-edit-outline' as const,
    titleKey: 'onboarding.track',
    descKey: 'onboarding.trackDesc',
  },
  {
    key: 'analyze',
    icon: 'chart-line' as const,
    titleKey: 'onboarding.analyze',
    descKey: 'onboarding.analyzeDesc',
  },
  {
    key: 'together',
    icon: 'account-group' as const,
    titleKey: 'onboarding.together',
    descKey: 'onboarding.togetherDesc',
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
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={64}
          color="#059669"
        />
      </View>
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
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(
            Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
          );
        }}
      />

      {/* Dot indicators */}
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
          const dotColor = scrollX.interpolate({
            inputRange,
            outputRange: ['#E2E8F0', '#059669', '#E2E8F0'],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  backgroundColor: dotColor,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomRow}>
        {!isLast ? (
          <TouchableOpacity onPress={onComplete} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLast ? t('onboarding.getStarted') : t('common.next')}
          </Text>
          {!isLast && (
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color="#FFFFFF"
              style={styles.nextIcon}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  slideTitle: {
    ...typography.h2,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDesc: {
    ...typography.body,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
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
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  skipText: {
    ...typography.body,
    color: '#64748B',
  },
  skipPlaceholder: {
    width: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    height: 52,
    minWidth: 140,
  },
  nextButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
  },
  nextIcon: {
    marginLeft: spacing.xs,
  },
});
