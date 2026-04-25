import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const SW = Dimensions.get('window').width;
const CARD_INNER_WIDTH = SW - 20 * 2 - 16 * 2;
const BAR_MAX_H = 72;
const LABEL_H = 18;
const LABEL_HOURS = new Set([0, 6, 12, 18]);

interface FluidDistributionCardProps {
  /** 24-element array: total fluid intake (ml) per hour of day */
  hourlyFluidMl: number[];
  /** Number of days spanned — used to compute daily average */
  days: number;
}

export function FluidDistributionCard({ hourlyFluidMl, days }: FluidDistributionCardProps) {
  const { t } = useTranslation();
  const barWidth = CARD_INNER_WIDTH / 24;

  const { maxMl, peakHour, totalMl } = useMemo(() => {
    let maxMl = 0;
    let peakHour = 0;
    let totalMl = 0;
    for (let h = 0; h < 24; h++) {
      totalMl += hourlyFluidMl[h];
      if (hourlyFluidMl[h] > maxMl) {
        maxMl = hourlyFluidMl[h];
        peakHour = h;
      }
    }
    return { maxMl, peakHour, totalMl };
  }, [hourlyFluidMl]);

  const scale = maxMl > 0 ? BAR_MAX_H / maxMl : 1;
  const dailyAvgMl = days > 0 ? Math.round(totalMl / days) : 0;
  const peakLabel = maxMl > 0
    ? `${String(peakHour).padStart(2, '0')}:00–${String(peakHour + 1).padStart(2, '0')}:00`
    : null;

  // Hydration status based on daily average (WHO guidance ~1500ml minimum for elderly)
  const hydrationColor = dailyAvgMl >= 1500 ? '#0D9488' : dailyAvgMl >= 1000 ? '#D97706' : '#EF4444';
  const hydrationLabel = dailyAvgMl >= 1500
    ? t('insights.fluidDist.hydrationGood')
    : dailyAvgMl >= 1000
    ? t('insights.fluidDist.hydrationFair')
    : t('insights.fluidDist.hydrationLow');

  return (
    <View style={st.card}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.iconBox}>
            <MaterialCommunityIcons name="cup-water" size={14} color="#FFF" />
          </View>
          <Text style={st.title}>{t('insights.fluidDist.title')}</Text>
        </View>
        {peakLabel && (
          <View style={st.peakBadge}>
            <Text style={st.peakText}>{t('insights.fluidDist.peak', { label: peakLabel })}</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={st.statsRow}>
        <View style={st.statBlock}>
          <Text style={st.statLabel}>{t('insights.fluidDist.dailyAvg')}</Text>
          <View style={st.statValueRow}>
            <Text style={[st.statValue, { color: hydrationColor }]}>
              {dailyAvgMl > 0 ? dailyAvgMl : '—'}
            </Text>
            {dailyAvgMl > 0 && <Text style={st.statUnit}>ml</Text>}
          </View>
        </View>
        <View style={[st.statBlock, st.statBlockRight]}>
          <Text style={st.statLabel}>{t('insights.fluidDist.hydrationStatus')}</Text>
          <View style={[st.statusBadge, { backgroundColor: `${hydrationColor}1A` }]}>
            <Text style={[st.statusText, { color: hydrationColor }]}>{hydrationLabel}</Text>
          </View>
        </View>
      </View>

      {/* Bar chart */}
      <View style={st.chartArea}>
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <View key={frac} style={[st.gridLine, { bottom: frac * BAR_MAX_H }]} />
        ))}
        <View style={st.barsRow}>
          {Array.from({ length: 24 }, (_, h) => {
            const ml = hourlyFluidMl[h];
            const barH = ml * scale;
            const isPeak = h === peakHour && maxMl > 0;
            return (
              <View key={h} style={[st.barCol, { width: barWidth }]}>
                <View style={[st.barStack, { height: BAR_MAX_H }]}>
                  {barH > 0 && (
                    <View
                      style={[
                        st.bar,
                        {
                          height: barH,
                          backgroundColor: isPeak ? '#2563EB' : '#93C5FD',
                          borderTopLeftRadius: 3,
                          borderTopRightRadius: 3,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text style={[st.hourLabel, isPeak && st.hourLabelPeak]}>
                  {LABEL_HOURS.has(h) ? String(h).padStart(2, '0') : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={st.legend}>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: '#93C5FD' }]} />
          <Text style={st.legendText}>{t('insights.fluidDist.legend')}</Text>
        </View>
        {maxMl > 0 && (
          <Text style={st.maxText}>{t('insights.fluidDist.peakValue', { ml: maxMl })}</Text>
        )}
      </View>

      {maxMl === 0 && (
        <View style={st.emptyOverlay}>
          <Text style={st.emptyText}>{t('insights.fluidDist.empty')}</Text>
        </View>
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
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  peakBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  peakText: { fontSize: 11, fontWeight: '600', color: '#1D4ED8' },

  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statBlock: { flex: 1 },
  statBlockRight: { alignItems: 'flex-end' },
  statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: '500' },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statUnit: { fontSize: 12, color: '#94A3B8' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  chartArea: { height: BAR_MAX_H + LABEL_H, position: 'relative' },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX_H + LABEL_H,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  barCol: { alignItems: 'center', justifyContent: 'flex-end', height: BAR_MAX_H + LABEL_H },
  barStack: { width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%' },
  hourLabel: { fontSize: 8, color: '#CBD5E1', marginTop: 2, height: LABEL_H, lineHeight: LABEL_H },
  hourLabelPeak: { color: '#2563EB', fontWeight: '700' },

  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#64748B' },
  maxText: { fontSize: 11, color: '#94A3B8', marginLeft: 'auto' },

  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
  },
  emptyText: { fontSize: 13, color: '#94A3B8' },
});
