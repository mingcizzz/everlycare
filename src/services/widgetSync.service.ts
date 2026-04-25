import { Platform } from 'react-native';
import WidgetSync from '../../modules/widget-sync';
import { supabase } from './supabase';

export interface WidgetPredictionPayload {
  predictedAt: string;
  windowStartAt: string;
  windowEndAt: string;
  urgencyLevel: 'low' | 'approaching' | 'high' | 'overdue';
  confidenceScore: number;
}

export interface WidgetDailySummaryPayload {
  urinationCount: number;
  bowelCount: number;
  accidentCount: number;
  medicationDone: number;
  medicationTotal: number;
  lastUpdated: string;
}

interface WidgetPayload {
  prediction?: WidgetPredictionPayload;
  dailySummary?: WidgetDailySummaryPayload;
  recipientName?: string;
  language?: string;
  // Credentials for direct Supabase writes from the widget extension
  supabaseUrl?: string;
  accessToken?: string;
  recipientId?: string;
  loggedBy?: string;
}

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://ypzlcrhriqcvgszxprbh.supabase.co';

class WidgetSyncService {
  private lastPayload: WidgetPayload = {};

  /** Sync toilet prediction data to the widget. Merges with existing daily summary. */
  async syncPrediction(
    prediction: WidgetPredictionPayload,
    recipientName: string,
    language: string,
    recipientId?: string,
  ): Promise<void> {
    if (Platform.OS !== 'ios') return;
    const creds = await this.getCredentials();
    this.lastPayload = {
      ...this.lastPayload,
      prediction,
      recipientName,
      language,
      recipientId: recipientId ?? this.lastPayload.recipientId,
      ...creds,
    };
    await this.flush();
  }

  /** Sync daily summary data to the widget. Merges with existing prediction. */
  async syncSummary(
    dailySummary: WidgetDailySummaryPayload,
    recipientName: string,
    language: string,
    recipientId?: string,
  ): Promise<void> {
    if (Platform.OS !== 'ios') return;
    const creds = await this.getCredentials();
    this.lastPayload = {
      ...this.lastPayload,
      dailySummary,
      recipientName,
      language,
      recipientId: recipientId ?? this.lastPayload.recipientId,
      ...creds,
    };
    await this.flush();
  }

  /** Sync both at once. */
  async syncAll(
    prediction: WidgetPredictionPayload | undefined,
    dailySummary: WidgetDailySummaryPayload | undefined,
    recipientName: string,
    language: string,
    recipientId?: string,
  ): Promise<void> {
    if (Platform.OS !== 'ios') return;
    const creds = await this.getCredentials();
    this.lastPayload = {
      prediction,
      dailySummary,
      recipientName,
      language,
      recipientId,
      ...creds,
    };
    await this.flush();
  }

  // ── Private ───────────────────────────────────────────────────────────

  /** Reads the current Supabase session to get a fresh access token. */
  private async getCredentials(): Promise<Pick<WidgetPayload, 'supabaseUrl' | 'accessToken' | 'loggedBy'>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        supabaseUrl:  SUPABASE_URL,
        accessToken:  session?.access_token ?? '',
        loggedBy:     session?.user?.id ?? '',
      };
    } catch {
      return {};
    }
  }

  private async flush(): Promise<void> {
    try {
      await WidgetSync.syncWidgetData(JSON.stringify(this.lastPayload));
    } catch {
      // Widget sync is best-effort — never crash the app
    }
  }
}

export const widgetSyncService = new WidgetSyncService();
