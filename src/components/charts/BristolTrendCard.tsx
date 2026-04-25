import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { TrendPoint } from '../../services/insights.service';

const SW = Dimensions.get('window').width;
const CARD_INNER_WIDTH = SW - 20 * 2 - 16 * 2;
const CHART_H = 80;
const LABEL_H = 16;

// Bristol scale color metadata (desc field not rendered — kept for reference)
const BRISTOL_COLORS = [
  { score: 1, color: '#92400E' },
  { score: 2, color: '#B45309' },
  { score: 3, color: '#059669' },
  { score: 4, color: '#0D9488' },
  { score: 5, color: '#D97706' },
  { score: 6, color: '#EA580C' },
  { score: 7, color: '#EF4444' },
];

function scoreColor(score: number): string {
  const idx = Math.round(score) - 1;
  return BRISTOL_COLORS[Math.max(0, Math.min(6, idx))]?.color ?? '#64748B';
}

interface BristolTrendCardProps {
  trend: TrendPoint[];
}

export function BristolTrendCard({ trend }: BristolTrendCardProps) {
  const { t } = useTranslation();

  const scoreLabel = (score: number): string => {
    if (score <= 2) return t('insights.bristol.labelHard');
    if (score <= 4) return t('insights.bristol.labelIdeal');
    return t('insights.bristol.labelSoft');
  };

  const { avgScore, latestScore, trendDir } = useMemo(() => {
    if (trend.length === 0) return { avgScore: null, latestScore: null, trendDir: null };
    const avg = trend.reduce((s, p) => s + p.value, 0) / trend.length;
    const latest = trend[trend.length - 1].value;
    const trendDir =
      trend.length >= 3
        ? trend[trend.length - 1].value - trend[trend.length - 3].value
        : null;
    return { avgScore: parseFloat(avg.toFixed(1)), latestScore: latest, trendDir };
  }, [trend]);

  const hasData = trend.length > 0;

  // Chart geometry
  const pointCount = trend.length;
  const stepX = pointCount > 1 ? CARD_INNER_WIDTH / (pointCount - 1) : 0;
  const yForScore = (score: number) => {
    return CHART_H - ((score - 1) / 6) * CHART_H;
  };

  const points = trend.map((p, i) => ({
    x: i * stepX,
    y: yForScore(p.value),
    value: p.value,
    date: p.date,
  }));

  const trendLabel = trendDir !== null
    ? trendDir > 0.3
      ? t('insights.bristol.trendSofter')
      : trendDir < -0.3
      ? t('insights.bristol.trendHarder')
      : t('insights.bristol.trendStable')
    : null;

  const trendColor = trendDir !== null
    ? trendDir > 0.3 ? '#D97706' : trendDir < -0.3 ? '#B45309' : '#0D9488'
    : '#0D9488';

  const trendIcon = trendDir !== null
    ? trendDir > 0.3 ? 'trending-up' : trendDir < -0.3 ? 'trending-down' : 'trending-neutral'
    : 'trending-neutral';

  return (
    <View style={st.card}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.iconBox}>
            <MaterialCommunityIcons name="chart-line" size={14} color="#FFF" />
          </View>
          <Text style={st.title}>{t('insights.bristol.title')}</Text>
          <Text style={st.subtitle}>{t('insights.bristol.subtitle')}</Text>
        </View>
        {latestScore !== null && (
          <View style={[st.scoreBadge, { backgroundColor: `${scoreColor(latestScore)}1A` }]}>
            <Text style={[st.scoreText, { color: scoreColor(latestScore) }]}>
              {t('insights.bristol.latestScore', { score: latestScore.toFixed(1), label: scoreLabel(latestScore) })}
            </Text>
          </View>
        )}
      </View>

      {!hasData ? (
        <View style={st.emptyRow}>
          <Text style={st.emptyText}>{t('insights.bristol.empty')}</Text>
        </View>
      ) : (
        <>
          {/* Stat row */}
          <View style={st.statRow}>
            <View style={st.statBlock}>
              <Text style={st.statLabel}>{t('insights.bristol.avgScore')}</Text>
              <Text style={[st.statValue, { color: avgScore ? scoreColor(avgScore) : '#1E293B' }]}>
                {avgScore !== null ? t('insights.bristol.avgScoreType', { score: avgScore.toFixed(1) }) : '—'}
              </Text>
            </View>
            {trendDir !== null && trendLabel !== null && (
              <View style={[st.statBlock, st.statBlockRight]}>
                <Text style={st.statLabel}>{t('insights.bristol.trend')}</Text>
                <View style={st.trendRow}>
                  <MaterialCommunityIcons
                    name={trendIcon as any}
                    size={18}
                    color={trendColor}
                  />
                  <Text style={[st.trendText, { color: trendColor }]}>
                    {trendLabel}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Line chart (custom SVG-free implementation) */}
          <View style={st.chartWrap}>
            {/* Horizontal reference bands */}
            <View style={[st.band, st.bandIdeal]} />

            {/* Y-axis labels */}
            {[1, 3, 4, 7].map(s => (
              <Text
                key={s}
                style={[st.yLabel, { top: yForScore(s) - 6 }]}
              >
                {s}
              </Text>
            ))}

            {/* Line segments */}
            {points.length > 1 && points.map((pt, i) => {
              if (i === 0) return null;
              const prev = points[i - 1];
              const dx = pt.x - prev.x;
              const dy = pt.y - prev.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View
                  key={i}
                  style={[
                    st.lineSegment,
                    {
                      left: prev.x,
                      top: prev.y,
                      width: length,
                      transform: [{ rotate: `${angle}deg` }],
                      backgroundColor: scoreColor(pt.value),
                    },
                  ]}
                />
              );
            })}

            {/* Data dots */}
            {points.map((pt, i) => (
              <View
                key={i}
                style={[
                  st.dot,
                  {
                    left: pt.x - 5,
                    top: pt.y - 5,
                    backgroundColor: scoreColor(pt.value),
                  },
                ]}
              />
            ))}
          </View>

          {/* X-axis labels — show every N-th date to avoid crowding */}
          <View style={st.xLabelRow}>
            {points
              .filter((_, i) => i % Math.max(1, Math.floor(points.length / 4)) === 0 || i === points.length - 1)
              .map((pt) => (
                <Text
                  key={pt.date}
                  style={[st.xLabel, { left: Math.min(pt.x, CARD_INNER_WIDTH - 28) }]}
                >
                  {pt.date}
                </Text>
              ))}
          </View>

          {/* Bristol scale quick-ref */}
          <View style={st.scaleRow}>
            {BRISTOL_COLORS.map((b) => (
              <View key={b.score} style={st.scaleItem}>
                <View style={[st.scaleDot, { backgroundColor: b.color }]} />
                <Text style={st.scaleNum}>{b.score}</Text>
              </View>
            ))}
            <Text style={st.scaleTip}>{t('insights.bristol.scaleTip')}</Text>
          </View>
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
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#92400E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  subtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  scoreText: { fontSize: 12, fontWeight: '700' },

  statRow: { flexDirection: 'row', marginBottom: 16 },
  statBlock: { flex: 1 },
  statBlockRight: { alignItems: 'flex-end' },
  statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trendText: { fontSize: 14, fontWeight: '600' },

  chartWrap: {
    height: CHART_H,
    width: '100%',
    position: 'relative',
    marginBottom: LABEL_H + 4,
    overflow: 'visible',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  bandIdeal: {
    top: CHART_H - ((4 - 1) / 6) * CHART_H,
    height: ((4 - 3) / 6) * CHART_H,
    backgroundColor: 'rgba(5,150,105,0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(5,150,105,0.15)',
  },
  yLabel: {
    position: 'absolute',
    left: -2,
    fontSize: 9,
    color: '#CBD5E1',
    width: 10,
    textAlign: 'right',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    transformOrigin: '0 50%',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  xLabelRow: {
    position: 'relative',
    height: LABEL_H,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    color: '#94A3B8',
    width: 28,
    textAlign: 'center',
  },

  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  scaleItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  scaleDot: { width: 8, height: 8, borderRadius: 4 },
  scaleNum: { fontSize: 9, color: '#64748B' },
  scaleTip: { fontSize: 9, color: '#CBD5E1', marginLeft: 4 },

  emptyRow: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8' },
});
