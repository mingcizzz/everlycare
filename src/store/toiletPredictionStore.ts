import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { careLogService } from '../services/carelog.service';
import { weatherService } from '../services/weather.service';
import { computeToiletPrediction, type PredictionResult } from '../services/toiletPrediction.engine';
import type { CareRecipient } from '../types/recipient';
import type { MealLogData, ActivityLogData } from '../types/careLog';
import { getToday } from '../utils/date';

const NOTIF_ID_KEY = 'everlycare.toilet.smart_notif_id';
const HISTORY_DAYS = 90;
const HISTORY_LIMIT = 500;

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ToiletPredictionState {
  prediction: PredictionResult | null;
  isLoading: boolean;
  weatherAvailable: boolean;
}

interface ToiletPredictionActions {
  /** Fetch data, run engine, update state + schedule notification. */
  refreshPrediction: (recipientId: string, recipient: CareRecipient) => Promise<void>;
  /** Call immediately after a urination log is saved. */
  onToiletVisitLogged: (recipientId: string, recipient: CareRecipient) => Promise<void>;
}

export const useToiletPredictionStore = create<ToiletPredictionState & ToiletPredictionActions>(
  (set, get) => ({
    prediction: null,
    isLoading: false,
    weatherAvailable: false,

    refreshPrediction: async (recipientId, recipient) => {
      if (get().isLoading) return;
      set({ isLoading: true });
      try {
        const today = getToday();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - HISTORY_DAYS);

        const [urinationLogs, mealLogs, activityLogs, weather] = await Promise.all([
          careLogService.getLogs(recipientId, { logType: 'urination', limit: HISTORY_LIMIT }),
          careLogService.getLogs(recipientId, { logType: 'meal', date: today }),
          careLogService.getLogs(recipientId, { logType: 'activity', date: today }),
          weatherService.getCurrentWeather(),
        ]);

        // Most recent urination (logs are ordered DESC)
        const lastUrinationAt = urinationLogs.length > 0
          ? new Date(urinationLogs[0].occurredAt)
          : null;

        // Historical urinations filtered to 90 days
        const historicalUrinations = urinationLogs
          .filter(l => new Date(l.occurredAt) >= cutoffDate)
          .map(l => new Date(l.occurredAt));

        // Fluid logs from today's meals
        const fluidLogs = mealLogs
          .filter(l => (l.data as MealLogData).mealType === 'fluid')
          .map(l => ({
            occurredAt: new Date(l.occurredAt),
            fluidMl: (l.data as MealLogData).fluidAmountMl ?? 0,
          }));

        // Activity logs
        const actLogs = activityLogs.map(l => ({
          occurredAt: new Date(l.occurredAt),
          durationMinutes: (l.data as ActivityLogData).durationMinutes ?? 0,
          type: (l.data as ActivityLogData).activityType,
        }));

        const prediction = computeToiletPrediction({
          now: new Date(),
          lastUrinationAt,
          historicalUrinations,
          todayFluidLogs: fluidLogs,
          todayActivityLogs: actLogs,
          weather,
          recipient,
        });

        set({ prediction, weatherAvailable: weather !== null });
        await scheduleSmartNotification(prediction);
      } catch {
        // Silent fail — prediction simply isn't updated
      } finally {
        set({ isLoading: false });
      }
    },

    onToiletVisitLogged: async (recipientId, recipient) => {
      await cancelSmartNotification();
      await get().refreshPrediction(recipientId, recipient);
    },
  })
);

// ── Notification helpers ──────────────────────────────────────────────────────

async function cancelSmartNotification(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOTIF_ID_KEY);
    }
  } catch { /* ignore */ }
}

async function scheduleSmartNotification(prediction: PredictionResult): Promise<void> {
  try {
    await cancelSmartNotification();
    if (prediction.urgencyLevel === 'overdue') return;

    const secondsFromNow = Math.floor(
      (prediction.windowStartAt.getTime() - Date.now()) / 1000
    );
    if (secondsFromNow < 60) return; // window already starting or passed

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚽 如厕时间到了',
        body: `预测时段：${fmtTime(prediction.windowStartAt)} – ${fmtTime(prediction.windowEndAt)}`,
        sound: 'default',
        data: { type: 'smart_toilet' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
        channelId: 'reminders',
      },
    });
    await AsyncStorage.setItem(NOTIF_ID_KEY, id);
  } catch { /* ignore */ }
}
