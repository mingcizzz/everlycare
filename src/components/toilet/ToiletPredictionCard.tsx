import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { type PredictionResult, getUrgencyLevel, type UrgencyLevel } from '../../services/toiletPrediction.engine';
import type { CareLog } from '../../types/careLog';

// ── Constants ────────────────────────────────────────────────────────────────

const STRIP_HEIGHT = 52;
const LABEL_HEIGHT = 18;
const SHOW_PAST_MIN = 60;   // 1 hour of past visible on the left
const TOTAL_MIN = 240;       // 4-hour window total

/** Minutes offset from display window start → rendered at every 30 min tick */
const TICK_OFFSETS = [0, 30, 60, 90, 120, 150, 180, 210, 240];

// ── Urgency config ────────────────────────────────────────────────────────────

const URGENCY_HEX: Record<UrgencyLevel, { hex: string; opacity: number; border: string }> = {
  low:        { hex: '#5EEAD4', opacity: 0.45, border: '#5EEAD4' },
  approaching:{ hex: '#0D9488', opacity: 0.75, border: '#0D9488' },
  high:       { hex: '#D97706', opacity: 0.88, border: '#D97706' },
  overdue:    { hex: '#EF4444', opacity: 0.92, border: '#EF4444' },
};

function toRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHHMM(d: Date, language: string): string {
  return d.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function confidenceDots(score: number): number {
  if (score >= 0.65) return 3;
  if (score >= 0.40) return 2;
  return 1;
}

// ── Adjustment factor icons ───────────────────────────────────────────────────

const FACTOR_ICONS: Record<string, string> = {
  weather:    'weather-partly-cloudy',
  activity:   'run',
  fluid:      'cup-water',
  age:        'account',
  medication: 'pill',
  pattern:    'chart-line',
};

// ── Timeline strip ────────────────────────────────────────────────────────────

interface StripProps {
  prediction: PredictionResult;
  todayUrinations: CareLog[];
  now: Date;
  urgency: UrgencyLevel;
  language: string;
  nowLabel: string;
}

function TimelineStrip({ prediction, todayUrinations, now, urgency, language, nowLabel }: StripProps) {
  const [stripWidth, setStripWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setStripWidth(e.nativeEvent.layout.width);
  }, []);

  const displayStart = new Date(now.getTime() - SHOW_PAST_MIN * 60000);

  const minuteToX = (time: Date): number => {
    if (stripWidth === 0) return 0;
    const diffMin = (time.getTime() - displayStart.getTime()) / 60000;
    return (diffMin / TOTAL_MIN) * stripWidth;
  };

  const nowX = minuteToX(now);
  const windowStartX = minuteToX(prediction.windowStartAt);
  const windowEndX   = minuteToX(prediction.windowEndAt);
  const predictedAtX = minuteToX(prediction.predictedAt);

  const windowWidth = Math.max(0, windowEndX - windowStartX);
  const windowVisible = windowEndX > 0 && windowStartX < stripWidth && windowWidth > 2;

  // Fraction of the predicted peak within the gradient rect (for locations prop)
  const predictedFraction = windowWidth > 0
    ? clamp((predictedAtX - windowStartX) / windowWidth, 0.1, 0.9)
    : 0.5;

  const { hex, opacity } = URGENCY_HEX[urgency];
  const gradColors: [string, string, string] = [
    toRgba(hex, 0),
    toRgba(hex, opacity),
    toRgba(hex, 0),
  ];

  return (
    <View>
      {/* Strip container */}
      <View style={st.stripOuter} onLayout={onLayout}>
        {stripWidth > 0 && (
          <>
            {/* Tick marks */}
            {TICK_OFFSETS.map(offset => {
              const x = (offset / TOTAL_MIN) * stripWidth;
              return (
                <View
                  key={offset}
                  style={[st.tick, { left: x }]}
                />
              );
            })}

            {/* Shaded past zone */}
            <View style={[st.pastZone, { width: Math.max(0, nowX) }]} />

            {/* Prediction gradient block */}
            {windowVisible && (
              <LinearGradient
                colors={gradColors}
                locations={[0, predictedFraction, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[st.predBlock, {
                  left: Math.max(0, windowStartX),
                  width: windowWidth,
                }]}
              />
            )}

            {/* Past toilet visit dots */}
            {todayUrinations.map(log => {
              const logTime = new Date(log.occurredAt);
              const x = minuteToX(logTime);
              if (x < 4 || x > stripWidth - 4) return null;
              return (
                <View
                  key={log.id}
                  style={[st.visitDot, { left: x - 5 }]}
                />
              );
            })}

            {/* NOW marker */}
            <View style={[st.nowLine, { left: Math.max(1, nowX - 1) }]} />
          </>
        )}
      </View>

      {/* Time labels row */}
      <View style={st.labelRow}>
        {stripWidth > 0 && TICK_OFFSETS.map(offset => {
          const x = (offset / TOTAL_MIN) * stripWidth;
          const labelTime = new Date(displayStart.getTime() + offset * 60000);
          return (
            <Text
              key={offset}
              style={[st.tickLabel, { left: x - 14 }]}
            >
              {fmtHHMM(labelTime, language)}
            </Text>
          );
        })}
      </View>

      {/* NOW label below strip */}
      {stripWidth > 0 && (
        <Text style={[st.nowLabel, { left: Math.max(0, nowX - 14) }]}>
          {nowLabel}
        </Text>
      )}
    </View>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface ToiletPredictionCardProps {
  prediction: PredictionResult | null;
  isLoading: boolean;
  todayUrinations: CareLog[];
  onLogToilet: () => void;
}

export function ToiletPredictionCard({
  prediction,
  isLoading,
  todayUrinations,
  onLogToilet,
}: ToiletPredictionCardProps) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(new Date());

  // Refresh "now" every minute so countdown and urgency stay live
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const countdown = (predictedAt: Date): string => {
    const diffMin = Math.round((predictedAt.getTime() - now.getTime()) / 60000);
    if (diffMin > 0) return t('home.outdoor.countdownFuture', { min: diffMin });
    if (diffMin === 0) return t('home.outdoor.countdownNow');
    return t('home.outdoor.countdownOverdue', { min: Math.abs(diffMin) });
  };

  const urgencyLabel = (level: UrgencyLevel): string => {
    const KEY: Record<UrgencyLevel, string> = {
      low: 'home.outdoor.urgencyLow',
      approaching: 'home.outdoor.urgencyApproaching',
      high: 'home.outdoor.urgencyHigh',
      overdue: 'home.outdoor.urgencyOverdue',
    };
    return t(KEY[level]);
  };

  if (isLoading && !prediction) {
    return (
      <View style={[st.card, st.loadingCard]}>
        <ActivityIndicator size="small" color="#0D9488" />
        <Text style={st.loadingText}>{t('home.outdoor.cardLoading')}</Text>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={[st.card, st.emptyCard]}>
        <MaterialCommunityIcons name="toilet" size={28} color="#CBD5E1" />
        <Text style={st.emptyText}>{t('home.outdoor.cardEmpty')}</Text>
      </View>
    );
  }

  const urgency = getUrgencyLevel(prediction, now);
  const cfg = URGENCY_HEX[urgency];
  const dots = confidenceDots(prediction.confidenceScore);

  // Active non-base adjustments to show as factor badges
  const activeFactors = prediction.adjustments.filter(
    a => a.factor !== 'base' && Math.abs(a.multiplier - 1.0) > 0.03
  );

  return (
    <View style={[st.card, { borderLeftColor: cfg.border }]}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <MaterialCommunityIcons name="toilet" size={18} color="#064E3B" />
          <Text style={st.headerTitle}>{t('home.outdoor.cardTitle')}</Text>
        </View>
        <View style={[st.urgencyBadge, { backgroundColor: toRgba(cfg.hex, 0.15) }]}>
          <Text style={[st.urgencyText, { color: cfg.border }]}>{urgencyLabel(urgency)}</Text>
        </View>
      </View>

      {/* Countdown + time range */}
      <View style={st.countdownRow}>
        <Text style={[st.countdown, { color: urgency === 'overdue' ? '#EF4444' : '#064E3B' }]}>
          {countdown(prediction.predictedAt)}
        </Text>
        <View style={st.dotsRow}>
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={[st.dot, { backgroundColor: i <= dots ? '#0D9488' : '#E2E8F0' }]}
            />
          ))}
        </View>
      </View>
      <Text style={st.windowRange}>
        {t('home.outdoor.cardWindow', {
          start: fmtHHMM(prediction.windowStartAt, i18n.language),
          end: fmtHHMM(prediction.windowEndAt, i18n.language),
        })}
      </Text>

      {/* Timeline strip */}
      <View style={st.stripWrap}>
        <TimelineStrip
          prediction={prediction}
          todayUrinations={todayUrinations}
          now={now}
          urgency={urgency}
          language={i18n.language}
          nowLabel={t('home.outdoor.cardNow')}
        />
      </View>

      {/* Footer: factor badges + log button */}
      <View style={st.footer}>
        <View style={st.factorBadges}>
          {activeFactors.slice(0, 3).map(a => (
            <View key={a.factor} style={st.factorChip}>
              <MaterialCommunityIcons
                name={FACTOR_ICONS[a.factor] as any ?? 'information-outline'}
                size={11}
                color="#64748B"
              />
              <Text style={st.factorText}>
                {a.multiplier < 1 ? t('home.outdoor.factorFreqUp') : t('home.outdoor.factorFreqDown')}
              </Text>
            </View>
          ))}
          {!prediction.hasHistoricalData && (
            <View style={st.factorChip}>
              <MaterialCommunityIcons name="information-outline" size={11} color="#94A3B8" />
              <Text style={[st.factorText, { color: '#94A3B8' }]}>{t('home.outdoor.factorAccumulating')}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={st.logBtn} onPress={onLogToilet} activeOpacity={0.8}>
          <MaterialCommunityIcons name="water" size={14} color="#FFF" />
          <Text style={st.logBtnText}>{t('home.outdoor.logNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#5EEAD4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.07,
    elevation: 3,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftColor: '#E2E8F0',
    paddingVertical: 20,
  },
  loadingText: { fontSize: 14, color: '#94A3B8' },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    borderLeftColor: '#E2E8F0',
    paddingVertical: 24,
  },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  urgencyText: { fontSize: 12, fontWeight: '600' },

  /* Countdown */
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdown: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  windowRange: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 14 },

  /* Strip */
  stripWrap: { marginBottom: 6 },
  stripOuter: {
    height: STRIP_HEIGHT,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  pastZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  predBlock: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 4,
  },
  visitDot: {
    position: 'absolute',
    bottom: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D9488',
  },
  nowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#064E3B',
  },

  /* Time labels */
  labelRow: {
    position: 'relative',
    height: LABEL_HEIGHT,
    marginTop: 2,
  },
  tickLabel: {
    position: 'absolute',
    fontSize: 9,
    color: '#94A3B8',
    width: 28,
    textAlign: 'center',
  },
  nowLabel: {
    position: 'absolute',
    fontSize: 9,
    color: '#064E3B',
    fontWeight: '700',
    top: -LABEL_HEIGHT - 2,
  },

  /* Footer */
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  factorBadges: { flexDirection: 'row', gap: 6, flex: 1 },
  factorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  factorText: { fontSize: 10, color: '#64748B', fontWeight: '500' },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#064E3B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
});
