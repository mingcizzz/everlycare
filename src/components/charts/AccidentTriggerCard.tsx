import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { AccidentTriggerStats } from '../../services/insights.service';

interface Props {
  stats: AccidentTriggerStats;
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function hourLabel(h: number, t: TFunction): string {
  const ampm = h < 12
    ? t('insights.accident.amMorning')
    : h < 18
    ? t('insights.accident.pmAfternoon')
    : t('insights.accident.pmEvening');
  const hh = h % 12 === 0 ? 12 : h % 12;
  return t('insights.accident.hourLabel', { ampm, h: hh });
}

interface TriggerRowProps {
  icon: string;
  iconColor: string;
  label: string;
  count: number;
  total: number;
  hint?: string;
}

function TriggerRow({ icon, iconColor, label, count, total, hint }: TriggerRowProps) {
  const ratio = total > 0 ? count / total : 0;
  const barColor = ratio >= 0.6 ? '#EF4444' : ratio >= 0.3 ? '#F59E0B' : '#10B981';

  return (
    <View style={st.triggerRow}>
      <View style={[st.triggerIcon, { backgroundColor: `${iconColor}1A` }]}>
        <MaterialCommunityIcons name={icon as any} size={14} color={iconColor} />
      </View>
      <View style={st.triggerBody}>
        <View style={st.triggerTop}>
          <Text style={st.triggerLabel}>{label}</Text>
          <Text style={[st.triggerPct, { color: barColor }]}>
            {pct(count, total)}
          </Text>
        </View>
        <View style={st.barBg}>
          <View style={[st.barFill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
        </View>
        {!!hint && <Text style={st.triggerHint}>{hint}</Text>}
      </View>
    </View>
  );
}

export function AccidentTriggerCard({ stats }: Props) {
  const { t } = useTranslation();
  const { totalAccidents, precedingMeal, precedingFluid, precedingActivity, topHours, avgMealToAccidentMin } = stats;
  const hasData = totalAccidents > 0;

  return (
    <View style={st.card}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.iconBox}>
            <MaterialCommunityIcons name="alert-circle" size={14} color="#FFF" />
          </View>
          <Text style={st.title}>{t('insights.accident.title')}</Text>
        </View>
        {hasData && (
          <View style={st.totalBadge}>
            <Text style={st.totalBadgeText}>
              {t('insights.accident.totalBadge', { count: totalAccidents })}
            </Text>
          </View>
        )}
      </View>
      <Text style={st.subtitle}>{t('insights.accident.subtitle')}</Text>

      {!hasData ? (
        <View style={st.emptyRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={32} color="#E2E8F0" />
          <Text style={st.emptyText}>{t('insights.accident.empty')}</Text>
          <Text style={st.emptyHint}>{t('insights.accident.emptyHint')}</Text>
        </View>
      ) : (
        <>
          {/* Trigger rows */}
          <View style={st.triggerList}>
            <TriggerRow
              icon="silverware-fork-knife"
              iconColor="#F59E0B"
              label={t('insights.accident.triggerMeal')}
              count={precedingMeal}
              total={totalAccidents}
              hint={avgMealToAccidentMin != null
                ? t('insights.accident.triggerMealHint', { min: avgMealToAccidentMin })
                : undefined}
            />
            <TriggerRow
              icon="cup-water"
              iconColor="#3B82F6"
              label={t('insights.accident.triggerFluid')}
              count={precedingFluid}
              total={totalAccidents}
            />
            <TriggerRow
              icon="walk"
              iconColor="#8B5CF6"
              label={t('insights.accident.triggerActivity')}
              count={precedingActivity}
              total={totalAccidents}
            />
          </View>

          {/* Top hours */}
          {topHours.length > 0 && (
            <View style={st.topHoursSection}>
              <Text style={st.topHoursTitle}>{t('insights.accident.topHours')}</Text>
              <View style={st.topHoursRow}>
                {topHours.map(({ hour, count }, idx) => (
                  <View key={hour} style={[st.hourChip, idx === 0 && st.hourChipTop]}>
                    <Text style={[st.hourChipTime, idx === 0 && st.hourChipTimeTop]}>
                      {hourLabel(hour, t)}
                    </Text>
                    <Text style={[st.hourChipCount, idx === 0 && st.hourChipCountTop]}>
                      {t('insights.accident.countSuffix', { count })}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={st.topHoursHint}>{t('insights.accident.topHoursHint')}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  totalBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  totalBadgeText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  subtitle: { fontSize: 12, color: '#94A3B8', marginBottom: 16, marginLeft: 34 },

  /* Empty */
  emptyRow: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 14, color: '#CBD5E1', fontWeight: '600' },
  emptyHint: { fontSize: 12, color: '#CBD5E1', textAlign: 'center', lineHeight: 18 },

  /* Trigger rows */
  triggerList: { gap: 14, marginBottom: 16 },
  triggerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  triggerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  triggerBody: { flex: 1 },
  triggerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  triggerLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
  triggerPct: { fontSize: 14, fontWeight: '700' },
  barBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  triggerHint: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

  /* Top hours */
  topHoursSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  topHoursTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
  },
  topHoursRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  hourChip: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  hourChipTop: {
    backgroundColor: '#FEE2E2',
  },
  hourChipTime: { fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  hourChipTimeTop: { fontSize: 13, color: '#991B1B' },
  hourChipCount: { fontSize: 11, color: '#EF4444' },
  hourChipCountTop: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  topHoursHint: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
});
