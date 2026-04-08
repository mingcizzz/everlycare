import { supabase } from './supabase';
import type { CareLog, LogType, LogData } from '../types/careLog';

export const careLogService = {
  async createLog(
    careRecipientId: string,
    logType: LogType,
    data: LogData,
    occurredAt: string,
    notes?: string
  ): Promise<CareLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: log, error } = await supabase
      .from('care_logs')
      .insert({
        care_recipient_id: careRecipientId,
        logged_by: user.id,
        log_type: logType,
        occurred_at: occurredAt,
        data,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return mapLogFromDb(log);
  },

  async getLogs(
    careRecipientId: string,
    options?: {
      date?: string; // YYYY-MM-DD
      logType?: LogType;
      limit?: number;
      offset?: number;
    }
  ): Promise<CareLog[]> {
    let query = supabase
      .from('care_logs')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('occurred_at', { ascending: false });

    if (options?.date) {
      const startOfDay = `${options.date}T00:00:00`;
      const endOfDay = `${options.date}T23:59:59`;
      query = query.gte('occurred_at', startOfDay).lte('occurred_at', endOfDay);
    }

    if (options?.logType) {
      query = query.eq('log_type', options.logType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapLogFromDb);
  },

  async getLogById(logId: string): Promise<CareLog | null> {
    const { data, error } = await supabase
      .from('care_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (error) return null;
    return mapLogFromDb(data);
  },

  async updateLog(logId: string, updates: Partial<{ data: LogData; notes: string; occurredAt: string }>) {
    const { error } = await supabase
      .from('care_logs')
      .update({
        ...(updates.data && { data: updates.data }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.occurredAt && { occurred_at: updates.occurredAt }),
      })
      .eq('id', logId);

    if (error) throw error;
  },

  async deleteLog(logId: string) {
    const { error } = await supabase
      .from('care_logs')
      .delete()
      .eq('id', logId);

    if (error) throw error;
  },

  async getDailySummary(careRecipientId: string, date: string) {
    const logs = await this.getLogs(careRecipientId, { date });

    const summary = {
      bowelCount: 0,
      urinationCount: 0,
      incontinenceCount: 0,
      mealCount: 0,
      fluidTotalMl: 0,
      medicationsTaken: 0,
      medicationsMissed: 0,
      totalLogs: logs.length,
    };

    for (const log of logs) {
      switch (log.logType) {
        case 'bowel':
          summary.bowelCount++;
          break;
        case 'urination':
          summary.urinationCount++;
          if ((log.data as any).isIncontinence) summary.incontinenceCount++;
          break;
        case 'meal':
          if ((log.data as any).mealType === 'fluid') {
            summary.fluidTotalMl += (log.data as any).fluidAmountMl || 0;
          } else {
            summary.mealCount++;
          }
          break;
        case 'medication':
          if ((log.data as any).status === 'taken') summary.medicationsTaken++;
          else if ((log.data as any).status === 'missed') summary.medicationsMissed++;
          break;
      }
    }

    return summary;
  },
};

function mapLogFromDb(row: any): CareLog {
  return {
    id: row.id,
    careRecipientId: row.care_recipient_id,
    loggedBy: row.logged_by,
    logType: row.log_type,
    occurredAt: row.occurred_at,
    data: row.data,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
