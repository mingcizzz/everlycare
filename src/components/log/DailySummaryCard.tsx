import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { logBackgrounds } from '../../theme';
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
      iconColor: colors.logBowel,
      bgColor: logBackgrounds.bowel,
    },
    {
      icon: 'cup-water' as const,
      value: `${summary.fluidTotalMl}`,
      unit: 'ml',
      label: t('insights.fluidIntake'),
      iconColor: colors.logUrination,
      bgColor: logBackgrounds.urination,
    },
    {
      icon: 'pill' as const,
      value: `${summary.medicationsTaken}`,
      label: t('medication.taken'),
      iconColor: colors.logMedication,
      bgColor: logBackgrounds.medication,
    },
    {
      icon: 'food-apple' as const,
      value: `${summary.mealCount}`,
      label: t('careLog.meal'),
      iconColor: colors.logMeal,
      bgColor: logBackgrounds.meal,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{t('home.todaySummary')}</Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.icon} style={styles.card}>
            {/* Icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={item.iconColor}
              />
            </View>

            {/* Value */}
            <View style={styles.valueRow}>
              <Text style={styles.itemValue}>{item.value}</Text>
              {item.unit && <Text style={styles.itemUnit}>{item.unit}</Text>}
            </View>

            {/* Label */}
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Fluid progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{t('insights.fluidIntake')}</Text>
          <Text style={styles.progressLabel}>
            {`${fluidPercent}%`}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${fluidPercent}%`,
                backgroundColor:
                  fluidPercent >= 100 ? colors.success : colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressSubLabel}>
          {`${summary.fluidTotalMl} / ${FLUID_DAILY_TARGET_ML}ml`}
        </Text>
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
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  itemValue: {
    ...typography.dataLarge,
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
  },
  itemUnit: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  itemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressSection: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});
