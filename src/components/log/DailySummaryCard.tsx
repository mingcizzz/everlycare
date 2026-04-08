import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius } from '../../theme';
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
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{t('home.todaySummary')}</Text>

        <View style={styles.grid}>
          <SummaryItem
            icon="toilet"
            label={t('insights.bathroomVisits')}
            value={`${summary.bowelCount + summary.urinationCount}`}
            subtitle={
              summary.incontinenceCount > 0
                ? `${summary.incontinenceCount} ${t('urination.accident')}`
                : undefined
            }
            color={colors.logBowel}
            alertColor={summary.incontinenceCount > 0 ? colors.error : undefined}
          />
          <SummaryItem
            icon="cup-water"
            label={t('insights.fluidIntake')}
            value={`${summary.fluidTotalMl}`}
            subtitle={`${fluidPercent}% / ${FLUID_DAILY_TARGET_ML}ml`}
            color={colors.logUrination}
          />
        </View>

        <View style={styles.grid}>
          <SummaryItem
            icon="pill"
            label={t('medication.taken')}
            value={`${summary.medicationsTaken}`}
            subtitle={
              summary.medicationsMissed > 0
                ? `${summary.medicationsMissed} ${t('medication.missed')}`
                : undefined
            }
            color={colors.logMedication}
            alertColor={summary.medicationsMissed > 0 ? colors.warning : undefined}
          />
          <SummaryItem
            icon="food-apple"
            label={t('careLog.meal')}
            value={`${summary.mealCount}`}
            color={colors.logMeal}
          />
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
      </Card.Content>
    </Card>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  subtitle,
  color,
  alertColor,
}: {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  alertColor?: string;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.itemText}>
        <Text style={styles.itemValue}>{value}</Text>
        <Text style={styles.itemLabel} numberOfLines={1}>
          {label}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.itemSubtitle,
              alertColor ? { color: alertColor } : undefined,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemValue: {
    ...typography.data,
    color: colors.textPrimary,
  },
  itemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
