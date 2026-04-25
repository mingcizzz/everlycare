import { careLogService } from './carelog.service';
import type { CareLog } from '../types/careLog';

export interface TrendPoint {
  date: string; // YYYY-MM-DD or short label
  value: number;
}

export interface IntervalStats {
  /** ISO timestamp of the most recent toilet event in the period */
  lastVoidAt: string | null;
  /** Mean inter-void interval in minutes (gaps < 5 min or > 8 hr excluded) */
  avgIntervalMinutes: number | null;
  /** Number of valid intervals used for the average */
  sampleCount: number;
}

export interface AccidentTriggerStats {
  /** Total accident events in the period */
  totalAccidents: number;
  /** Accidents preceded by any meal within 60 min prior */
  precedingMeal: number;
  /** Accidents preceded by fluid intake >200 ml within 60 min prior */
  precedingFluid: number;
  /** Accidents preceded by any activity log within 60 min prior */
  precedingActivity: number;
  /** Top 3 hours of day by accident frequency */
  topHours: { hour: number; count: number }[];
  /** Average minutes from preceding meal to accident (null if no data) */
  avgMealToAccidentMin: number | null;
}

export interface InsightsData {
  bathroomTrend: TrendPoint[];
  fluidTrend: TrendPoint[];
  incontinenceTrend: TrendPoint[];
  medicationAdherence: number; // 0-100
  totalLogs: number;
  /** Hourly counts indexed 0–23 for normal toilet visits (urination planned/spontaneous + bowel non-accident) */
  hourlyNormal: number[];
  /** Hourly counts indexed 0–23 for incontinence / accident events */
  hourlyAccident: number[];
  /** Inter-void interval statistics for the period */
  intervalStats: IntervalStats;
  /** Total fluid intake (ml) per hour of day, indexed 0–23 */
  hourlyFluidMl: number[];
  /** Daily average Bristol stool scale score (1–7) for the period */
  bristolTrend: TrendPoint[];
  /** Meal descriptions correlated with bowel Bristol scores (lookup window: 4–8h prior) */
  dietCorrelations: { mealDescription: string; avgBristol: number; sampleCount: number }[];
  /** Accident trigger analysis — what typically precedes incontinence events */
  accidentTriggers: AccidentTriggerStats;
}

export const insightsService = {
  async getInsights(
    careRecipientId: string,
    days: number = 7
  ): Promise<InsightsData> {
    // Fetch all logs for the range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const allLogs: CareLog[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = await careLogService.getLogs(careRecipientId, {
        date: dateStr,
      });
      allLogs.push(...dayLogs);
    }

    // Build trends
    const bathroomByDay = new Map<string, number>();
    const fluidByDay = new Map<string, number>();
    const incontinenceByDay = new Map<string, number>();
    let medsTaken = 0;
    let medsTotal = 0;

    // Hourly heatmap arrays (index = hour 0–23)
    const hourlyNormal = Array<number>(24).fill(0);
    const hourlyAccident = Array<number>(24).fill(0);

    // Fluid distribution (ml per hour) and Bristol trend
    const hourlyFluidMl = Array<number>(24).fill(0);
    const bristolByDay = new Map<string, { sum: number; count: number }>();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      bathroomByDay.set(key, 0);
      fluidByDay.set(key, 0);
      incontinenceByDay.set(key, 0);
    }

    for (const log of allLogs) {
      const day = log.occurredAt.split('T')[0];
      const data = log.data as any;
      const hour = new Date(log.occurredAt).getHours();

      switch (log.logType) {
        case 'bowel':
          bathroomByDay.set(day, (bathroomByDay.get(day) || 0) + 1);
          if (data.isAccident) {
            hourlyAccident[hour]++;
          } else {
            hourlyNormal[hour]++;
          }
          if (typeof data.bristolScale === 'number' && data.bristolScale >= 1 && data.bristolScale <= 7) {
            const prev = bristolByDay.get(day) ?? { sum: 0, count: 0 };
            bristolByDay.set(day, { sum: prev.sum + data.bristolScale, count: prev.count + 1 });
          }
          break;
        case 'urination':
          bathroomByDay.set(day, (bathroomByDay.get(day) || 0) + 1);
          if (data.isIncontinence || data.method === 'accident') {
            incontinenceByDay.set(day, (incontinenceByDay.get(day) || 0) + 1);
            hourlyAccident[hour]++;
          } else {
            hourlyNormal[hour]++;
          }
          break;
        case 'meal':
          if (data.mealType === 'fluid' && data.fluidAmountMl) {
            fluidByDay.set(
              day,
              (fluidByDay.get(day) || 0) + data.fluidAmountMl
            );
            hourlyFluidMl[hour] += data.fluidAmountMl;
          }
          break;
        case 'medication':
          medsTotal++;
          if (data.status === 'taken') medsTaken++;
          break;
      }
    }

    const toTrend = (map: Map<string, number>): TrendPoint[] =>
      Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
          date: date.slice(5), // MM-DD
          value,
        }));

    // ── Diet × bowel correlation ─────────────────────────────────────────────
    const bowelWithBristol = allLogs.filter(
      l => l.logType === 'bowel' && typeof (l.data as any).bristolScale === 'number'
    );
    const mealMap = new Map<string, { sum: number; count: number }>();
    for (const bowel of bowelWithBristol) {
      const bristolScore = (bowel.data as any).bristolScale as number;
      const bowelTime = new Date(bowel.occurredAt).getTime();
      // Look for meals eaten 4–8 hours before this bowel event
      const windowStart = bowelTime - 8 * 3600000;
      const windowEnd   = bowelTime - 4 * 3600000;
      const priorMeals = allLogs.filter(l => {
        if (l.logType !== 'meal') return false;
        const t = new Date(l.occurredAt).getTime();
        return t >= windowStart && t <= windowEnd;
      });
      for (const meal of priorMeals) {
        const desc = ((meal.data as any).description as string | undefined)?.trim();
        if (!desc) continue;
        const prev = mealMap.get(desc) ?? { sum: 0, count: 0 };
        mealMap.set(desc, { sum: prev.sum + bristolScore, count: prev.count + 1 });
      }
    }
    const dietCorrelations = Array.from(mealMap.entries())
      .filter(([, v]) => v.count >= 2) // require ≥2 observations for relevance
      .map(([mealDescription, { sum, count }]) => ({
        mealDescription,
        avgBristol: parseFloat((sum / count).toFixed(1)),
        sampleCount: count,
      }))
      .sort((a, b) => b.sampleCount - a.sampleCount)
      .slice(0, 8); // top 8 most frequent

    // ── Bristol trend (daily average score) ─────────────────────────────────
    const bristolTrend: TrendPoint[] = Array.from(bristolByDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { sum, count }]) => ({
        date: date.slice(5),
        value: parseFloat((sum / count).toFixed(1)),
      }));

    // ── Accident trigger analysis ────────────────────────────────────────────
    const accidentLogs = allLogs.filter(l => {
      const d = l.data as any;
      return (l.logType === 'urination' && (d.isIncontinence || d.method === 'accident')) ||
             (l.logType === 'bowel' && d.isAccident);
    });

    const accidentHourCounts = Array<number>(24).fill(0);
    let accPrecedingMeal = 0;
    let accPrecedingFluid = 0;
    let accPrecedingActivity = 0;
    const mealToAccidentMins: number[] = [];

    for (const acc of accidentLogs) {
      const accTime = new Date(acc.occurredAt).getTime();
      accidentHourCounts[new Date(acc.occurredAt).getHours()]++;

      const windowStart = accTime - 60 * 60000;
      const priorLogs = allLogs.filter(l => {
        const t = new Date(l.occurredAt).getTime();
        return t >= windowStart && t < accTime;
      });

      let hasMeal = false;
      let hasActivity = false;
      for (const prior of priorLogs) {
        const pd = prior.data as any;
        if (prior.logType === 'meal') {
          hasMeal = true;
          mealToAccidentMins.push((accTime - new Date(prior.occurredAt).getTime()) / 60000);
          if (typeof pd.fluidAmountMl === 'number' && pd.fluidAmountMl > 200) {
            accPrecedingFluid++;
          }
        }
        if (prior.logType === 'activity') hasActivity = true;
      }
      if (hasMeal) accPrecedingMeal++;
      if (hasActivity) accPrecedingActivity++;
    }

    const topHours = accidentHourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const avgMealToAccidentMin = mealToAccidentMins.length > 0
      ? Math.round(mealToAccidentMins.reduce((a, b) => a + b, 0) / mealToAccidentMins.length)
      : null;

    const accidentTriggers: AccidentTriggerStats = {
      totalAccidents: accidentLogs.length,
      precedingMeal: accPrecedingMeal,
      precedingFluid: accPrecedingFluid,
      precedingActivity: accPrecedingActivity,
      topHours,
      avgMealToAccidentMin,
    };

    // ── Interval statistics ──────────────────────────────────────────────────
    const toiletLogs = allLogs
      .filter((l) => l.logType === 'urination' || l.logType === 'bowel')
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    let intervalStats: IntervalStats = { lastVoidAt: null, avgIntervalMinutes: null, sampleCount: 0 };

    if (toiletLogs.length >= 1) {
      const lastVoidAt = toiletLogs[toiletLogs.length - 1].occurredAt;
      const gaps: number[] = [];
      for (let i = 1; i < toiletLogs.length; i++) {
        const diffMin =
          (new Date(toiletLogs[i].occurredAt).getTime() -
            new Date(toiletLogs[i - 1].occurredAt).getTime()) /
          60000;
        // Exclude duplicate-level noise (< 5 min) and overnight gaps (> 8 hr)
        if (diffMin >= 5 && diffMin <= 480) gaps.push(diffMin);
      }
      const avg = gaps.length > 0
        ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
        : null;
      intervalStats = { lastVoidAt, avgIntervalMinutes: avg, sampleCount: gaps.length };
    }

    return {
      bathroomTrend: toTrend(bathroomByDay),
      fluidTrend: toTrend(fluidByDay),
      incontinenceTrend: toTrend(incontinenceByDay),
      medicationAdherence:
        medsTotal === 0 ? 0 : Math.round((medsTaken / medsTotal) * 100),
      totalLogs: allLogs.length,
      hourlyNormal,
      hourlyAccident,
      intervalStats,
      hourlyFluidMl,
      bristolTrend,
      dietCorrelations,
      accidentTriggers,
    };
  },
};
