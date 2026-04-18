import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useRecipientStore } from '../../../store/recipientStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { insightsService, type InsightsData } from '../../../services/insights.service';
import { reportService } from '../../../services/report.service';
import { TrendLineChart } from '../../../components/charts/TrendLineChart';
import type { MainTabScreenProps } from '../../../types/navigation';

type PeriodKey = 'daily' | 'weekly' | 'monthly';

const PERIODS: { key: PeriodKey; labelKey: string }[] = [
  { key: 'daily', labelKey: 'insights.daily' },
  { key: 'weekly', labelKey: 'insights.weekly' },
  { key: 'monthly', labelKey: 'insights.monthly' },
];

const DAYS_MAP: Record<PeriodKey, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export function InsightsScreen({ navigation }: MainTabScreenProps<'Insights'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const { language } = useSettingsStore();
  const [period, setPeriod] = useState<PeriodKey>('weekly');
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const daysForPeriod = DAYS_MAP[period];

  const refresh = useCallback(async () => {
    if (!activeRecipient) return;
    setIsLoading(true);
    try {
      const insights = await insightsService.getInsights(
        activeRecipient.id,
        daysForPeriod
      );
      setData(insights);
    } finally {
      setIsLoading(false);
    }
  }, [activeRecipient?.id, daysForPeriod]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleExport = async () => {
    if (!activeRecipient) return;
    setIsExporting(true);
    try {
      await reportService.generateAndSharePdf({
        recipient: activeRecipient,
        days: daysForPeriod,
        language,
      });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = data && data.totalLogs > 0;

  const getAdherenceColor = (value: number) => {
    if (value >= 80) return colors.success;
    if (value >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('insights.title')}</Text>
        </View>

        {/* Period Selector + Export */}
        <View style={styles.controlsRow}>
          <View style={styles.pillGroup}>
            {PERIODS.map((p) => {
              const isActive = period === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.pill,
                    isActive && styles.pillActive,
                  ]}
                  onPress={() => setPeriod(p.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isActive && styles.pillTextActive,
                    ]}
                  >
                    {t(p.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            disabled={isExporting || !hasData}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name="file-export-outline"
              size={16}
              color={hasData ? colors.textSecondary : colors.textTertiary}
            />
            <Text
              style={[
                styles.exportText,
                !hasData && { color: colors.textTertiary },
              ]}
            >
              {t('insights.exportReport')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {!hasData ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons
                name="chart-line"
                size={64}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>{t('insights.noDataYet')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('insights.noDataYet')}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {/* Bathroom Visits */}
            <MetricCard
              icon="toilet"
              title={t('insights.bathroomVisits')}
              color={colors.logBowel}
            >
              <TrendLineChart
                data={data.bathroomTrend}
                lineColor={colors.logBowel}
              />
            </MetricCard>

            {/* Fluid Intake */}
            <MetricCard
              icon="cup-water"
              title={t('insights.fluidIntake')}
              color={colors.logUrination}
            >
              <TrendLineChart
                data={data.fluidTrend}
                lineColor={colors.logUrination}
                suffix="ml"
              />
            </MetricCard>

            {/* Incontinence Events */}
            <MetricCard
              icon="alert-circle"
              title={t('insights.incontinenceEvents')}
              color={colors.error}
            >
              <TrendLineChart
                data={data.incontinenceTrend}
                lineColor={colors.error}
              />
            </MetricCard>

            {/* Medication Adherence */}
            <MetricCard
              icon="pill"
              title={t('insights.medicationAdherence')}
              color={colors.logMedication}
            >
              <View style={styles.adherenceContainer}>
                <Text
                  style={[
                    styles.adherenceValue,
                    { color: getAdherenceColor(data.medicationAdherence) },
                  ]}
                >
                  {data.medicationAdherence}%
                </Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${data.medicationAdherence}%`,
                        backgroundColor: getAdherenceColor(
                          data.medicationAdherence
                        ),
                      },
                    ]}
                  />
                </View>
              </View>
            </MetricCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  MetricCard                                                         */
/* ------------------------------------------------------------------ */

function MetricCard({
  icon,
  title,
  color,
  children,
}: {
  icon: string;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <View
          style={[
            styles.metricIconCircle,
            { backgroundColor: color + '15' },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={color}
          />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <View style={styles.metricBody}>{children}</View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: 3,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl - 3,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exportText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
  },
  metricBody: {
    marginLeft: 0,
  },

  // Adherence
  adherenceContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  adherenceValue: {
    ...typography.dataXL,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
