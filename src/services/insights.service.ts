import { careLogService } from './carelog.service';
import type { CareLog } from '../types/careLog';

export interface TrendPoint {
  date: string; // YYYY-MM-DD or short label
  value: number;
}

export interface InsightsData {
  bathroomTrend: TrendPoint[];
  fluidTrend: TrendPoint[];
  incontinenceTrend: TrendPoint[];
  medicationAdherence: number; // 0-100
  totalLogs: number;
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

      switch (log.logType) {
        case 'bowel':
          bathroomByDay.set(day, (bathroomByDay.get(day) || 0) + 1);
          break;
        case 'urination':
          bathroomByDay.set(day, (bathroomByDay.get(day) || 0) + 1);
          if (data.isIncontinence) {
            incontinenceByDay.set(day, (incontinenceByDay.get(day) || 0) + 1);
          }
          break;
        case 'meal':
          if (data.mealType === 'fluid' && data.fluidAmountMl) {
            fluidByDay.set(
              day,
              (fluidByDay.get(day) || 0) + data.fluidAmountMl
            );
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

    return {
      bathroomTrend: toTrend(bathroomByDay),
      fluidTrend: toTrend(fluidByDay),
      incontinenceTrend: toTrend(incontinenceByDay),
      medicationAdherence:
        medsTotal === 0 ? 0 : Math.round((medsTaken / medsTotal) * 100),
      totalLogs: allLogs.length,
    };
  },
};
