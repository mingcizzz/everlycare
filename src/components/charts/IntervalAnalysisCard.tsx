import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { IntervalStats } from '../../services/insights.service';

interface IntervalAnalysisCardProps {
  stats: IntervalStats;
  /** Already-translated period label, e.g. "近7天" or "this week" */
  periodLabel: string;
}

function formatElapsed(minutes: number, t: TFunction): string {
  if (minutes < 60) return t('insights.interval.minutesAgo', { m: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0
    ? t('insights.interval.hoursMinutesAgo', { h, m })
    : t('insights.interval.hoursAgo', { h });
}

function formatDuration(minutes: number, t: TFunction): string {
  if (minutes < 60) return t('insights.interval.minutesDur', { m: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0
    ? t('insights.interval.hoursMinutesDur', { h, m })
    : t('insights.interval.hoursDur', { h });
}

export function IntervalAnalysisCard({ stats, periodLabel }: IntervalAnalysisCardProps) {
  const { t } = useTranslation();

  const { elapsedMin, ratio, statusColor, statusLabel, diffText } = useMemo(() => {
    const now = Date.now();
    const elapsedMin = stats.lastVoidAt
      ? Math.round((now - new Date(stats.lastVoidAt).getTime()) / 60000)
      : null;

    if (elapsedMin === null || stats.avgIntervalMinutes === null) {
      return { elapsedMin, ratio: 0, statusColor: '#94A3B8', statusLabel: t('insights.interval.statusAccumulating'), diffText: null };
    }

    const ratio = Math.min(elapsedMin / stats.avgIntervalMinutes, 1.5);
    const diff = elapsedMin - stats.avgIntervalMinutes;

    let statusColor: string;
    let statusLabel: string;
    if (ratio < 0.8) {
      statusColor = '#0D9488';
      statusLabel = t('insights.interval.statusNormal');
    } else if (ratio < 1.0) {
      statusColor = '#D97706';
      statusLabel = t('insights.interval.statusApproaching');
    } else {
      statusColor = '#EF4444';
      statusLabel = t('insights.interval.statusOverdue');
    }

    const diffText =
      diff > 0
        ? t('insights.interval.longerThanAvg', { duration: formatDuration(diff, t) })
        : diff < 0
        ? t('insights.interval.shorterThanAvg', { duration: formatDuration(Math.abs(diff), t) })
        : t('insights.interval.exactAvg');

    return { elapsedMin, ratio, statusColor, statusLabel, diffText };
  }, [stats, t]);

  return (
    <View style={st.card}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.iconBox}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#FFF" />
          </View>
          <Text style={st.title}>{t('insights.interval.title')}</Text>
        </View>
        <Text style={st.periodLabelStyle}>{periodLabel}</Text>
      </View>

      {stats.lastVoidAt === null ? (
        /* No data yet */
        <View style={st.emptyRow}>
          <Text style={st.emptyText}>{t('insights.interval.empty')}</Text>
        </View>
      ) : (
        <>
          {/* Two-column stat row */}
          <View style={st.statRow}>
            <View style={st.statBlock}>
              <Text style={st.statLabel}>{t('insights.interval.lastVoid')}</Text>
              <Text style={[st.statValue, { color: elapsedMin !== null && elapsedMin > (stats.avgIntervalMinutes ?? Infinity) ? '#EF4444' : '#1E293B' }]}>
                {elapsedMin !== null ? formatElapsed(elapsedMin, t) : '—'}
              </Text>
            </View>
            <View style={[st.statBlock, st.statBlockRight]}>
              <Text style={st.statLabel}>{t('insights.interval.avgLabel', { period: periodLabel })}</Text>
              <Text style={st.statValue}>
                {stats.avgIntervalMinutes !== null
                  ? formatDuration(stats.avgIntervalMinutes, t)
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Progress bar — only if we have an average */}
          {stats.avgIntervalMinutes !== null && elapsedMin !== null && (
            <>
              <View style={st.barBg}>
                <View
                  style={[
                    st.barFill,
                    {
                      width: `${Math.min(ratio / 1.5, 1) * 100}%`,
                      backgroundColor: statusColor,
                    },
                  ]}
                />
                {/* Average marker at 66.7% of bar width (= 1.0 / 1.5) */}
                <View style={st.avgMarker} />
              </View>
              <View style={st.barLabels}>
                <Text style={st.barLabelLeft}>0</Text>
                <Text style={[st.barLabelMid, { color: '#64748B' }]}>
                  {t('insights.interval.barAvg', { duration: formatDuration(stats.avgIntervalMinutes, t) })}
                </Text>
                <Text style={st.barLabelRight}>
                  {t('insights.interval.barMax', { duration: formatDuration(Math.round(stats.avgIntervalMinutes * 1.5), t) })}
                </Text>
              </View>
            </>
          )}

          {/* Status + diff row */}
          <View style={st.footer}>
            <View style={[st.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
              <View style={[st.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[st.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {diffText && stats.avgIntervalMinutes !== null && (
              <Text style={st.diffText}>{diffText}</Text>
            )}
          </View>

          {/* Sample count */}
          {stats.sampleCount > 0 && (
            <Text style={st.sampleText}>{t('insights.interval.sampleCount', { count: stats.sampleCount })}</Text>
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  periodLabelStyle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Stats */
  statRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statBlock: {
    flex: 1,
  },
  statBlockRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },

  /* Progress bar */
  barBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'visible',
    marginBottom: 4,
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  avgMarker: {
    position: 'absolute',
    top: -3,
    // 1/1.5 = 66.7% along the bar
    left: '66.7%',
    width: 2,
    height: 14,
    backgroundColor: '#CBD5E1',
    borderRadius: 1,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  barLabelLeft: { fontSize: 9, color: '#CBD5E1' },
  barLabelMid: { fontSize: 9, color: '#94A3B8' },
  barLabelRight: { fontSize: 9, color: '#CBD5E1' },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diffText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },

  /* Sample count */
  sampleText: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 10,
  },

  /* Empty */
  emptyRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
