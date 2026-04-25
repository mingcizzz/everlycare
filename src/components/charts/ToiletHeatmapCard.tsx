import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const SW = Dimensions.get('window').width;
// Card has 16px inner padding each side; screen has 20px outer padding each side
const CARD_INNER_WIDTH = SW - 20 * 2 - 16 * 2;
const BAR_MAX_H = 72; // px — tallest possible bar
const LABEL_H = 18;   // px — row below bars for hour labels

// Hours to show a label for (every 3 hours)
const LABEL_HOURS = new Set([0, 3, 6, 9, 12, 15, 18, 21]);

interface ToiletHeatmapCardProps {
  /** 24-element array: normal toilet visit counts per hour (index = hour 0–23) */
  hourlyNormal: number[];
  /** 24-element array: accident/incontinence counts per hour */
  hourlyAccident: number[];
  /** Number of days the data spans — used to compute daily average */
  days: number;
}

export function ToiletHeatmapCard({
  hourlyNormal,
  hourlyAccident,
  days,
}: ToiletHeatmapCardProps) {
  const { t } = useTranslation();
  const barWidth = CARD_INNER_WIDTH / 24;

  const { maxTotal, peakHour, totalNormal, totalAccident } = useMemo(() => {
    let maxTotal = 0;
    let peakHour = 0;
    let totalNormal = 0;
    let totalAccident = 0;
    for (let h = 0; h < 24; h++) {
      const total = hourlyNormal[h] + hourlyAccident[h];
      totalNormal += hourlyNormal[h];
      totalAccident += hourlyAccident[h];
      if (total > maxTotal) {
        maxTotal = total;
        peakHour = h;
      }
    }
    return { maxTotal, peakHour, totalNormal, totalAccident };
  }, [hourlyNormal, hourlyAccident]);

  const scale = maxTotal > 0 ? BAR_MAX_H / maxTotal : 1;

  const peakLabel = maxTotal > 0
    ? `${String(peakHour).padStart(2, '0')}:00–${String(peakHour + 1).padStart(2, '0')}:00`
    : null;

  const total = totalNormal + totalAccident;
  const summaryText = totalAccident > 0
    ? t('insights.heatmap.summaryWithAccident', { days, total, accidents: totalAccident })
    : t('insights.heatmap.summary', { days, total });

  return (
    <View style={st.card}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.iconBox}>
            <MaterialCommunityIcons name="chart-bar" size={14} color="#FFF" />
          </View>
          <Text style={st.title}>{t('insights.heatmap.title')}</Text>
        </View>
        {peakLabel && (
          <View style={st.peakBadge}>
            <Text style={st.peakText}>{t('insights.heatmap.peak', { label: peakLabel })}</Text>
          </View>
        )}
      </View>

      {/* Subtitle */}
      <Text style={st.subtitle}>{summaryText}</Text>

      {/* Bar chart */}
      <View style={st.chartArea}>
        {/* Y-axis ghost lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <View
            key={frac}
            style={[st.gridLine, { bottom: frac * BAR_MAX_H }]}
          />
        ))}

        {/* Bars */}
        <View style={st.barsRow}>
          {Array.from({ length: 24 }, (_, h) => {
            const normal = hourlyNormal[h];
            const accident = hourlyAccident[h];
            const normalH = normal * scale;
            const accidentH = accident * scale;
            const isPeak = h === peakHour && maxTotal > 0;

            return (
              <View key={h} style={[st.barCol, { width: barWidth }]}>
                <View style={[st.barStack, { height: BAR_MAX_H }]}>
                  {/* Stacked from bottom: normal (teal) then accident (red) on top */}
                  {normalH > 0 && (
                    <View
                      style={[
                        st.barSegment,
                        {
                          height: normalH,
                          backgroundColor: isPeak ? '#0D9488' : '#5EEAD4',
                          borderTopLeftRadius: accidentH > 0 ? 0 : 3,
                          borderTopRightRadius: accidentH > 0 ? 0 : 3,
                        },
                      ]}
                    />
                  )}
                  {accidentH > 0 && (
                    <View
                      style={[
                        st.barSegment,
                        {
                          height: accidentH,
                          backgroundColor: '#EF4444',
                          borderTopLeftRadius: 3,
                          borderTopRightRadius: 3,
                        },
                      ]}
                    />
                  )}
                </View>
                {/* Hour label */}
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
          <View style={[st.legendDot, { backgroundColor: '#5EEAD4' }]} />
          <Text style={st.legendText}>{t('insights.heatmap.legendNormal')}</Text>
        </View>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={st.legendText}>{t('insights.heatmap.legendAccident')}</Text>
        </View>
        {days > 1 && (
          <Text style={st.avgText}>
            {t('insights.heatmap.dailyAvg', { avg: ((totalNormal + totalAccident) / days).toFixed(1) })}
          </Text>
        )}
      </View>

      {/* Empty state */}
      {maxTotal === 0 && (
        <View style={st.emptyOverlay}>
          <Text style={st.emptyText}>{t('insights.heatmap.empty')}</Text>
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  peakBadge: {
    backgroundColor: '#FEF9C3',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  peakText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    marginLeft: 34,
  },

  /* Chart */
  chartArea: {
    height: BAR_MAX_H + LABEL_H,
    position: 'relative',
  },
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
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_MAX_H + LABEL_H,
  },
  barStack: {
    width: '70%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barSegment: {
    width: '100%',
  },
  hourLabel: {
    fontSize: 8,
    color: '#CBD5E1',
    marginTop: 2,
    height: LABEL_H,
    lineHeight: LABEL_H,
  },
  hourLabelPeak: {
    color: '#0D9488',
    fontWeight: '700',
  },

  /* Legend */
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
  },
  avgText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 'auto',
  },

  /* Empty */
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
