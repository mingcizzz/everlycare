/**
 * Toilet timing prediction engine — pure TypeScript, no side effects.
 *
 * Evidence base: 照护心得第31篇 (Caregiver Insights #31, docs/reference/)
 * Key findings from 2+ years of real caregiver experience:
 *  - Patients are not truly incontinent early-stage; they can't express urgency in time
 *  - Fixed 2-hour reminders (stage 1) are ineffective — personal rhythm matters
 *  - Post-breakfast: ~2hr average; post-lunch: shorter (~1-1.5hr)
 *  - Heat + low humidity → more evaporation → shorter interval
 *  - Sitting 2-3 min on toilet to fully empty bladder extends the next interval
 *  - Outdoor stimuli (elevators, restroom signs) trigger urgency
 */

import type { CareRecipient } from '../types/recipient';

// ── Time-of-day defaults (from caregiver experience) ─────────────────────────

const BASE_INTERVALS_MINUTES: Record<string, number> = {
  night:     240, // 00–05h: nighttime, bladder capacity largest at rest
  morning:   120, // 06–10h: post-breakfast 2hr peak
  midday:     90, // 11–13h: post-lunch, shorter interval
  afternoon: 120, // 14–17h: afternoon
  evening:   120, // 18–21h: evening
  latenight: 180, // 22–23h: winding down
};

function getTimeBucket(hour: number): string {
  if (hour < 6)  return 'night';
  if (hour < 11) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'latenight';
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PredictionInput {
  now: Date;
  lastUrinationAt: Date | null;
  historicalUrinations: Date[];        // last 90 days, any order
  todayFluidLogs: { occurredAt: Date; fluidMl: number }[];
  todayActivityLogs: { occurredAt: Date; durationMinutes: number; type: string }[];
  weather: { tempC: number; humidityPct: number } | null;
  recipient: Pick<CareRecipient, 'dateOfBirth' | 'medicalConditions'>;
}

export type UrgencyLevel = 'low' | 'approaching' | 'high' | 'overdue';

export type AdjustmentFactor =
  | 'base' | 'pattern' | 'weather' | 'activity' | 'fluid' | 'age' | 'medication';

export interface AdjustmentDetail {
  factor: AdjustmentFactor;
  multiplier: number;
  reason: string;
}

export interface PredictionResult {
  predictedAt: Date;
  windowStartAt: Date;
  windowEndAt: Date;
  confidenceScore: number;             // 0.0–1.0
  urgencyLevel: UrgencyLevel;
  baseIntervalMinutes: number;
  adjustedIntervalMinutes: number;
  adjustments: AdjustmentDetail[];
  hasHistoricalData: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

// ── Pattern learning: weighted-median inter-urination gap ─────────────────────

function computePatternMultiplier(
  historical: Date[],
  currentHour: number,
  baseInterval: number,
  now: Date
): { multiplier: number; confidenceBoost: number; sampleCount: number } {
  const bucketCenter: Record<string, number> = {
    night: 3, morning: 8, midday: 12, afternoon: 16, evening: 20, latenight: 22,
  };
  const bucket = getTimeBucket(currentHour);
  const center = bucketCenter[bucket] ?? 12;

  const sorted = [...historical].sort((a, b) => a.getTime() - b.getTime());

  const gaps: { gap: number; weight: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (Math.abs(prev.getHours() - center) > 2.5) continue;
    const gapMin = (curr.getTime() - prev.getTime()) / 60000;
    if (gapMin < 20 || gapMin > 420) continue;          // filter implausible gaps
    const daysAgo = (now.getTime() - prev.getTime()) / 86400000;
    gaps.push({ gap: gapMin, weight: Math.exp(-0.05 * daysAgo) }); // exponential decay
  }

  if (gaps.length < 3) return { multiplier: 1.0, confidenceBoost: 0, sampleCount: 0 };

  // Weighted median
  gaps.sort((a, b) => a.gap - b.gap);
  const totalW = gaps.reduce((s, g) => s + g.weight, 0);
  let cum = 0;
  let median = gaps[0].gap;
  for (const { gap, weight } of gaps) {
    cum += weight;
    if (cum >= totalW / 2) { median = gap; break; }
  }

  return {
    multiplier: clamp(median / baseInterval, 0.5, 1.6),
    confidenceBoost: Math.min(0.40, (gaps.length / 20) * 0.40),
    sampleCount: gaps.length,
  };
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function computeToiletPrediction(input: PredictionInput): PredictionResult {
  const { now, lastUrinationAt, historicalUrinations,
          todayFluidLogs, todayActivityLogs, weather, recipient } = input;

  const adjustments: AdjustmentDetail[] = [];
  let confidenceScore = 0.25;

  // 1. Base interval from time-of-day ─────────────────────────────────────────
  const bucket = getTimeBucket(now.getHours());
  const baseInterval = BASE_INTERVALS_MINUTES[bucket];
  adjustments.push({ factor: 'base', multiplier: 1.0,
    reason: `时段默认 (${bucket}): ${baseInterval} 分钟` });

  // 2. Personal pattern learning ───────────────────────────────────────────────
  const { multiplier: patternMult, confidenceBoost, sampleCount } =
    computePatternMultiplier(historicalUrinations, now.getHours(), baseInterval, now);
  if (Math.abs(patternMult - 1.0) > 0.05) {
    adjustments.push({ factor: 'pattern', multiplier: patternMult,
      reason: `个人规律 (${sampleCount} 条): ~${Math.round(baseInterval * patternMult)} 分钟` });
  }
  confidenceScore += confidenceBoost;

  // 3. Weather: heat + low humidity → more evaporation → shorter interval ──────
  let weatherMult = 1.0;
  if (weather) {
    const tempF    = lerp(1.0, 0.78, (weather.tempC - 15) / 25);       // 15°C→1.0, 40°C→0.78
    const humidF   = lerp(1.0, 0.85, (90 - weather.humidityPct) / 70); // 90%→1.0, 20%→0.85
    weatherMult = tempF * humidF;
    if (Math.abs(weatherMult - 1.0) > 0.04) {
      adjustments.push({ factor: 'weather', multiplier: weatherMult,
        reason: `${Math.round(weather.tempC)}°C / 湿度${Math.round(weather.humidityPct)}%` });
    }
    confidenceScore += 0.08;
  }

  // 4. Recent activity: exercise increases fluid loss ───────────────────────────
  const cutoff4h = new Date(now.getTime() - 4 * 3600000);
  const recentActivity = todayActivityLogs.filter(
    a => a.occurredAt >= cutoff4h && ['walking', 'exercise'].includes(a.type)
  );
  let activityMult = 1.0;
  if (recentActivity.length > 0) {
    const totalMin = recentActivity.reduce((s, a) => s + (a.durationMinutes || 30), 0);
    activityMult = 1.0 - clamp(totalMin / 60, 0, 1) * 0.20;
    adjustments.push({ factor: 'activity', multiplier: activityMult,
      reason: `近 4h 运动 ${totalMin} 分钟` });
    confidenceScore += 0.05;
  }

  // 5. Recent fluid intake accelerates next urination ──────────────────────────
  const cutoff2h = new Date(now.getTime() - 2 * 3600000);
  const recentMl = todayFluidLogs
    .filter(f => f.occurredAt >= cutoff2h)
    .reduce((s, f) => s + f.fluidMl, 0);
  let fluidMult = 1.0;
  if (recentMl > 100) {
    fluidMult = 1.0 - clamp(recentMl / 500, 0, 1) * 0.25;
    adjustments.push({ factor: 'fluid', multiplier: fluidMult,
      reason: `近 2h 摄入 ${recentMl}ml` });
  }

  // 6. Age: bladder capacity decreases with age ─────────────────────────────────
  let ageMult = 1.0;
  if (recipient.dateOfBirth) {
    const age = (now.getTime() - new Date(recipient.dateOfBirth).getTime()) / (365.25 * 86400000);
    if (age >= 80)      ageMult = 0.83;
    else if (age >= 75) ageMult = 0.88;
    else if (age >= 70) ageMult = 0.92;
    if (ageMult !== 1.0) {
      adjustments.push({ factor: 'age', multiplier: ageMult,
        reason: `${Math.floor(age)} 岁，膀胱容量减小` });
    }
  }

  // 7. Medication / condition keywords ──────────────────────────────────────────
  const cond = recipient.medicalConditions.join(' ').toLowerCase();
  const SHORTEN = ['diuretic','furosemide','lasix','hydrochlorothiazide','spironolactone',
    'overactive bladder','膀胱过度活动','interstitial cystitis','diabetes insipidus','利尿','卫喜康'];
  const LENGTHEN = ['anticholinergic','oxybutynin','tolterodine','parkinson',
    'neurogenic bladder','抗胆碱','神经源性'];
  let medMult = 1.0;
  if (SHORTEN.some(k => cond.includes(k))) {
    medMult = 0.78;
    adjustments.push({ factor: 'medication', multiplier: 0.78, reason: '利尿/膀胱过度活动症' });
  } else if (LENGTHEN.some(k => cond.includes(k))) {
    medMult = 1.18;
    adjustments.push({ factor: 'medication', multiplier: 1.18, reason: '抗胆碱/神经源性膀胱' });
  }

  // ── Compose ───────────────────────────────────────────────────────────────
  const totalMult = patternMult * weatherMult * activityMult * fluidMult * ageMult * medMult;
  const adjustedInterval = clamp(Math.round(baseInterval * totalMult), 30, 240);

  // If no urination logged yet, estimate start as 40% into the interval ago
  const startTime = lastUrinationAt ?? new Date(now.getTime() - adjustedInterval * 0.4 * 60000);
  const predictedAt = new Date(startTime.getTime() + adjustedInterval * 60000);

  // Window narrows as confidence grows (more data = tighter prediction)
  confidenceScore = clamp(confidenceScore, 0, 1.0);
  const halfWindowMin = Math.round(lerp(30, 12, confidenceScore));
  const windowStartAt = new Date(predictedAt.getTime() - halfWindowMin * 60000);
  const windowEndAt   = new Date(predictedAt.getTime() + halfWindowMin * 60000);

  let urgencyLevel: UrgencyLevel;
  if (now < windowStartAt)     urgencyLevel = 'low';
  else if (now <= predictedAt) urgencyLevel = 'approaching';
  else if (now <= windowEndAt) urgencyLevel = 'high';
  else                         urgencyLevel = 'overdue';

  return {
    predictedAt, windowStartAt, windowEndAt,
    confidenceScore, urgencyLevel,
    baseIntervalMinutes: baseInterval,
    adjustedIntervalMinutes: adjustedInterval,
    adjustments,
    hasHistoricalData: sampleCount >= 3,
  };
}

/** Re-compute urgency from stored prediction + current time.
 *  Use in UI so color stays fresh without re-running the full engine. */
export function getUrgencyLevel(prediction: PredictionResult, now: Date): UrgencyLevel {
  if (now < prediction.windowStartAt)  return 'low';
  if (now <= prediction.predictedAt)   return 'approaching';
  if (now <= prediction.windowEndAt)   return 'high';
  return 'overdue';
}
