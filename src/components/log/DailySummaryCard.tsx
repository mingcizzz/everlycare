import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows, logBackgrounds } from '../../theme';
import { FLUID_DAILY_TARGET_ML } from '../../utils/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 12;
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
            <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={22}
                color={item.iconColor}
              />
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.itemValue}>{item.value}</Text>
              {item.unit && <Text style={styles.itemUnit}>{item.unit}</Text>}
            </View>

            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  itemUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94A3B8',
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
});
