import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../../theme';
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
  const ins = useSafeAreaInsets();
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
    if (value >= 80) return '#10B981';
    if (value >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const periodLabel =
    period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'this month';

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#FFF"
          />
        }
      >
        {/* ━━ DARK HERO ━━ */}
        <LinearGradient
          colors={['#064E3B', '#065F46', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[st.hero, { paddingTop: ins.top + 20 }]}
        >
          {/* Decorative circles */}
          <View style={st.decoCircle1} />
          <View style={st.decoCircle2} />

          {/* Title */}
          <Text style={st.heroTitle}>{t('insights.title')}</Text>

          {/* Period Selector Pills */}
          <View style={st.pillContainer}>
            {PERIODS.map((p) => {
              const isActive = period === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[st.pill, isActive && st.pillActive]}
                  onPress={() => setPeriod(p.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[st.pillText, isActive && st.pillTextActive]}>
                    {t(p.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hero Metric */}
          {hasData ? (
            <View style={st.heroMetric}>
              <Text style={st.heroNumber}>{data.totalLogs}</Text>
              <Text style={st.heroLabel}>care events {periodLabel}</Text>
            </View>
          ) : (
            <View style={st.heroMetric}>
              <Text style={st.heroNumber}>--</Text>
              <Text style={st.heroLabel}>care events {periodLabel}</Text>
            </View>
          )}
        </LinearGradient>

        {/* ━━ LIGHT SECTION ━━ */}
        <View style={st.lightSection}>
          {!hasData ? (
            /* Empty State */
            <View style={st.emptyContainer}>
              <View style={st.emptyIconWrap}>
                <MaterialCommunityIcons
                  name={'chart-line' as any}
                  size={48}
                  color="#94A3B8"
                />
              </View>
              <Text style={st.emptyTitle}>{t('insights.noDataYet')}</Text>
              <Text style={st.emptySub}>
                Start logging care events to see trends and insights here.
              </Text>
            </View>
          ) : (
            <>
              {/* Export Button */}
              <TouchableOpacity
                style={st.exportPill}
                onPress={handleExport}
                disabled={isExporting}
                activeOpacity={0.7}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#64748B" />
                ) : (
                  <MaterialCommunityIcons
                    name={'file-pdf-box' as any}
                    size={16}
                    color="#64748B"
                  />
                )}
                <Text style={st.exportText}>{t('insights.exportReport')}</Text>
              </TouchableOpacity>

              {/* Metric Cards */}
              <View style={st.cardsContainer}>
                {/* Bathroom Visits */}
                <PressableMetricCard
                  icon="toilet"
                  title={t('insights.bathroomVisits')}
                  dotColor="#F59E0B"
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
                  dotColor="#3B82F6"
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
                  dotColor="#EF4444"
                >
                  <TrendLineChart
                    data={data.incontinenceTrend}
                    lineColor={colors.error}
                  />
                </PressableMetricCard>

                {/* Medication Adherence */}
                <View style={st.card}>
                  <View style={st.cardHeader}>
                    <View style={[st.cardDot, { backgroundColor: '#8B5CF6' }]}>
                      <MaterialCommunityIcons
                        name={'pill' as any}
                        size={14}
                        color="#FFF"
                      />
                    </View>
                    <Text style={st.cardTitle}>
                      {t('insights.medicationAdherence')}
                    </Text>
                  </View>
                  <View style={st.adherenceBody}>
                    <Text
                      style={[
                        st.adherenceValue,
                        { color: getAdherenceColor(data.medicationAdherence) },
                      ]}
                    >
                      {data.medicationAdherence}%
                    </Text>
                    <View style={st.progressBarBg}>
                      <View
                        style={[
                          st.progressBarFill,
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
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  PressableMetricCard with scale animation                           */
/* ------------------------------------------------------------------ */

function PressableMetricCard({
  icon,
  title,
  dotColor,
  children,
}: {
  icon: string;
  title: string;
  dotColor: string;
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
      style={[st.card, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={st.cardHeader}>
          <View style={[st.cardDot, { backgroundColor: dotColor }]}>
            <MaterialCommunityIcons
              name={icon as any}
              size={14}
              color="#FFF"
            />
          </View>
          <Text style={st.cardTitle}>{title}</Text>
        </View>
        <View style={st.cardBody}>{children}</View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  /* ━━ HERO ━━ */
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 20,
  },

  /* Period Pills */
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#FFF',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  pillTextActive: {
    color: '#064E3B',
    fontWeight: '700',
  },

  /* Hero Metric */
  heroMetric: {
    alignItems: 'center',
  },
  heroNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -2,
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
    fontWeight: '500',
  },

  /* ━━ LIGHT SECTION ━━ */
  lightSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  /* Export Pill */
  exportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 20,
  },
  exportText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Cards */
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  cardBody: {
    marginLeft: 0,
  },

  /* Adherence */
  adherenceBody: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  adherenceValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 14,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
