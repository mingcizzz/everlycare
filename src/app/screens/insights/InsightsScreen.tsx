import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, SegmentedButtons, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useRecipientStore } from '../../../store/recipientStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { insightsService, type InsightsData } from '../../../services/insights.service';
import { reportService } from '../../../services/report.service';
import { TrendLineChart } from '../../../components/charts/TrendLineChart';
import type { MainTabScreenProps } from '../../../types/navigation';

export function InsightsScreen({ navigation }: MainTabScreenProps<'Insights'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const { language } = useSettingsStore();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const daysForPeriod = { daily: 1, weekly: 7, monthly: 30 }[period];

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

  const hasData = data && data.totalLogs > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('insights.title')}</Text>
      </View>

      <SegmentedButtons
        value={period}
        onValueChange={(v) => setPeriod(v as 'daily' | 'weekly' | 'monthly')}
        buttons={[
          { value: 'daily', label: t('insights.daily') },
          { value: 'weekly', label: t('insights.weekly') },
          { value: 'monthly', label: t('insights.monthly') },
        ]}
        style={styles.segmented}
      />

      <Button
        mode="contained-tonal"
        icon="file-pdf-box"
        onPress={handleExport}
        loading={isExporting}
        disabled={isExporting || !data || data.totalLogs === 0}
        style={styles.exportButton}
      >
        {t('insights.exportReport')}
      </Button>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {!hasData ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="chart-line"
                size={48}
                color={colors.textDisabled}
              />
              <Text style={styles.emptyText}>{t('insights.noDataYet')}</Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <InsightCard
              icon="toilet"
              title={t('insights.bathroomVisits')}
              color={colors.logBowel}
            >
              <TrendLineChart
                data={data.bathroomTrend}
                lineColor={colors.logBowel}
              />
            </InsightCard>

            <InsightCard
              icon="cup-water"
              title={t('insights.fluidIntake')}
              color={colors.logUrination}
            >
              <TrendLineChart
                data={data.fluidTrend}
                lineColor={colors.logUrination}
                suffix="ml"
              />
            </InsightCard>

            <InsightCard
              icon="alert-circle"
              title={t('insights.incontinenceEvents')}
              color={colors.error}
            >
              <TrendLineChart
                data={data.incontinenceTrend}
                lineColor={colors.error}
              />
            </InsightCard>

            <InsightCard
              icon="pill"
              title={t('insights.medicationAdherence')}
              color={colors.logMedication}
            >
              <View style={styles.adherenceContainer}>
                <Text style={styles.adherenceValue}>
                  {data.medicationAdherence}%
                </Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${data.medicationAdherence}%`,
                        backgroundColor:
                          data.medicationAdherence >= 80
                            ? colors.success
                            : data.medicationAdherence >= 50
                            ? colors.warning
                            : colors.error,
                      },
                    ]}
                  />
                </View>
              </View>
            </InsightCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InsightCard({
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
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {children}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  segmented: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  exportButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  adherenceContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  adherenceValue: {
    ...typography.dataLarge,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
});
