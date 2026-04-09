import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows, logGradients } from '../../theme';
import { FLUID_DAILY_TARGET_ML } from '../../utils/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = spacing.sm;
const PADDING = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP) / 2;

interface DailySummary {
  bowelCount: number;
  urinationCount: number;
  incontinenceCount: number;
  mealCount: number;
  fluidTotalMl: number;
  medicationsTaken: number;
  medicationsMissed: number;
  totalLogs: number;
}

interface DailySummaryCardProps {
  summary: DailySummary;
}

export function DailySummaryCard({ summary }: DailySummaryCardProps) {
  const { t } = useTranslation();

  const fluidPercent = Math.min(
    100,
    Math.round((summary.fluidTotalMl / FLUID_DAILY_TARGET_ML) * 100)
  );

  const items = [
    {
      icon: 'toilet' as const,
      value: `${summary.bowelCount + summary.urinationCount}`,
      label: t('insights.bathroomVisits'),
      gradient: logGradients.bowel as [string, string],
    },
    {
      icon: 'cup-water' as const,
      value: `${summary.fluidTotalMl}ml`,
      label: t('insights.fluidIntake'),
      gradient: logGradients.urination as [string, string],
    },
    {
      icon: 'pill' as const,
      value: `${summary.medicationsTaken}`,
      label: t('medication.taken'),
      gradient: logGradients.medication as [string, string],
    },
    {
      icon: 'food-apple' as const,
      value: `${summary.mealCount}`,
      label: t('careLog.meal'),
      gradient: logGradients.meal as [string, string],
    },
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{t('home.todaySummary')}</Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.icon} style={styles.cardWrapper}>
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <MaterialCommunityIcons name={item.icon} size={24} color="#FFFFFF" />
              <Text style={styles.itemValue}>{item.value}</Text>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      {/* Fluid progress bar */}
      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>
          {`${fluidPercent}% / ${FLUID_DAILY_TARGET_ML}ml`}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${fluidPercent}%`,
                backgroundColor:
                  fluidPercent >= 100 ? colors.success : colors.logUrination,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    ...shadows.sm,
  },
  itemValue: {
    ...typography.dataLarge,
    color: '#FFFFFF',
    fontSize: 22,
    marginTop: spacing.xs,
  },
  itemLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
