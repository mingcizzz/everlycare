import { create } from 'zustand';
import type { CareLog, LogType, LogData } from '../types/careLog';
import { careLogService } from '../services/carelog.service';
import { widgetSyncService } from '../services/widgetSync.service';
import { useSettingsStore } from './settingsStore';
import { useRecipientStore } from './recipientStore';

interface DailySummary {
  bowelCount: number;
  urinationCount: number;
  incontinenceCount: number;
  mealCount: number;
  fluidTotalMl: number;
  medicationsTaken: number;
  medicationsMissed: number;
  totalLogs: number;
}

interface CareLogStore {
  logs: CareLog[];
  dailySummary: DailySummary | null;
  isLoading: boolean;
  loadLogs: (recipientId: string, date?: string) => Promise<void>;
  loadDailySummary: (recipientId: string, date: string) => Promise<void>;
  addLog: (
    recipientId: string,
    logType: LogType,
    data: LogData,
    occurredAt: string,
    notes?: string
  ) => Promise<CareLog>;
  deleteLog: (logId: string) => Promise<void>;
}

export const useCareLogStore = create<CareLogStore>((set, get) => ({
  logs: [],
  dailySummary: null,
  isLoading: false,

  loadLogs: async (recipientId, date) => {
    set({ isLoading: true });
    try {
      const logs = await careLogService.getLogs(recipientId, { date });
      set({ logs, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadDailySummary: async (recipientId, date) => {
    try {
      const summary = await careLogService.getDailySummary(recipientId, date);
      set({ dailySummary: summary });

      // Sync daily summary to iOS widget (best-effort)
      const language = useSettingsStore.getState().language;
      const recipient = useRecipientStore.getState().activeRecipient;
      widgetSyncService.syncSummary(
        {
          urinationCount:  summary.urinationCount,
          bowelCount:      summary.bowelCount,
          accidentCount:   summary.incontinenceCount,
          medicationDone:  summary.medicationsTaken,
          medicationTotal: summary.medicationsTaken + summary.medicationsMissed,
          lastUpdated:     new Date().toISOString(),
        },
        recipient?.name ?? '',
        language,
        recipientId,
      ).catch(() => {});
    } catch {
      // silently fail
    }
  },

  addLog: async (recipientId, logType, data, occurredAt, notes) => {
    const log = await careLogService.createLog(recipientId, logType, data, occurredAt, notes);
    set((state) => ({
      logs: [log, ...state.logs],
    }));
    return log;
  },

  deleteLog: async (logId) => {
    await careLogService.deleteLog(logId);
    set((state) => ({
      logs: state.logs.filter((l) => l.id !== logId),
    }));
  },
}));
