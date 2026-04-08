import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, logGradients } from '../../theme';
import { GradientCard } from '../ui/GradientCard';
import { FLUID_DAILY_TARGET_ML } from '../../utils/constants';

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

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{t('home.todaySummary')}</Text>

      <View style={styles.grid}>
        {/* Bathroom Visits */}
        <GradientCard
          gradientColors={logGradients.bowel}
          style={styles.gridItem}
        >
          <MaterialCommunityIcons name="toilet" size={28} color="#FFFFFF" />
          <Text style={styles.itemValue}>
            {`${summary.bowelCount + summary.urinationCount}`}
          </Text>
          <Text style={styles.itemLabel} numberOfLines={1}>
            {t('insights.bathroomVisits')}
          </Text>
        </GradientCard>

        {/* Fluid Intake */}
        <GradientCard
          gradientColors={logGradients.urination}
          style={styles.gridItem}
        >
          <MaterialCommunityIcons name="cup-water" size={28} color="#FFFFFF" />
          <Text style={styles.itemValue}>
            {`${summary.fluidTotalMl}`}
          </Text>
          <Text style={styles.itemLabel} numberOfLines={1}>
            {t('insights.fluidIntake')}
          </Text>
        </GradientCard>

        {/* Medication */}
        <GradientCard
          gradientColors={logGradients.medication}
          style={styles.gridItem}
        >
          <MaterialCommunityIcons name="pill" size={28} color="#FFFFFF" />
          <Text style={styles.itemValue}>
            {`${summary.medicationsTaken}`}
          </Text>
          <Text style={styles.itemLabel} numberOfLines={1}>
            {t('medication.taken')}
          </Text>
        </GradientCard>

        {/* Meals */}
        <GradientCard
          gradientColors={logGradients.meal}
          style={styles.gridItem}
        >
          <MaterialCommunityIcons name="food-apple" size={28} color="#FFFFFF" />
          <Text style={styles.itemValue}>
            {`${summary.mealCount}`}
          </Text>
          <Text style={styles.itemLabel} numberOfLines={1}>
            {t('careLog.meal')}
          </Text>
        </GradientCard>
      </View>

      {/* Fluid progress bar */}
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
    gap: spacing.sm,
  },
  gridItem: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  itemValue: {
    ...typography.data,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  itemLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
});
