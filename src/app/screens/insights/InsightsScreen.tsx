import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Animated,
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

  const periodLabel =
    period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'this month';

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

        {/* Period Pills */}
        <View style={styles.periodContainer}>
          <View style={styles.pillGroup}>
            {PERIODS.map((p) => {
              const isActive = period === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setPeriod(p.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.pillText, isActive && styles.pillTextActive]}
                  >
                    {t(p.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Content */}
        {!hasData ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons
                name={'chart-line' as any}
                size={48}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyText}>
              {t('insights.noDataYet')}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {/* Hero Card - Total Logs */}
            <View style={styles.heroCard}>
              <Text style={styles.heroNumber}>{data.totalLogs}</Text>
              <Text style={styles.heroLabel}>
                care events {periodLabel}
              </Text>
            </View>

            {/* Bathroom Visits */}
            <PressableMetricCard
              icon="toilet"
              title={t('insights.bathroomVisits')}
              color={colors.logBowel}
            >
              <TrendLineChart
                data={data.bathroomTrend}
                lineColor={colors.logBowel}
              />
            </PressableMetricCard>

            {/* Fluid Intake */}
            <PressableMetricCard
              icon="cup-water"
              title={t('insights.fluidIntake')}
              color={colors.logUrination}
            >
              <TrendLineChart
                data={data.fluidTrend}
                lineColor={colors.logUrination}
                suffix="ml"
              />
            </PressableMetricCard>

            {/* Incontinence Events */}
            <PressableMetricCard
              icon="alert-circle"
              title={t('insights.incontinenceEvents')}
              color={colors.error}
            >
              <TrendLineChart
                data={data.incontinenceTrend}
                lineColor={colors.error}
              />
            </PressableMetricCard>

            {/* Medication Adherence */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View
                  style={[
                    styles.metricIconCircle,
                    { backgroundColor: colors.logMedication + '15' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={'pill' as any}
                    size={22}
                    color={colors.logMedication}
                  />
                </View>
                <Text style={styles.metricTitle}>
                  {t('insights.medicationAdherence')}
                </Text>
              </View>
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
            </View>

            {/* Export Button */}
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExport}
              disabled={isExporting}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons
                name={'download' as any}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.exportText}>
                {t('insights.exportReport')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  PressableMetricCard with scale animation                           */
/* ------------------------------------------------------------------ */

function PressableMetricCard({
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
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[styles.metricCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.metricHeader}>
          <View
            style={[
              styles.metricIconCircle,
              { backgroundColor: color + '15' },
            ]}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={22}
              color={color}
            />
          </View>
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <View style={styles.metricBody}>{children}</View>
      </TouchableOpacity>
    </Animated.View>
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Period Pills
  periodContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  pillTextActive: {
    fontWeight: '600',
    color: '#FFFFFF',
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
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: spacing.md,
    gap: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  heroNumber: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -1.0,
  },
  heroLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Metric Card
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1.0,
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

  // Export Button
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  exportText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
