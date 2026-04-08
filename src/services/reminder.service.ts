import { supabase } from './supabase';
import type { Reminder, ReminderSchedule } from '../types/recipient';

export const reminderService = {
  async getAll(careRecipientId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFromDb);
  },

  async create(
    careRecipientId: string,
    title: string,
    reminderType: Reminder['reminderType'],
    schedule: ReminderSchedule
  ): Promise<Reminder> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        care_recipient_id: careRecipientId,
        created_by: user.id,
        title,
        reminder_type: reminderType,
        schedule,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapFromDb(data);
  },

  async update(
    id: string,
    updates: Partial<{
      title: string;
      schedule: ReminderSchedule;
      isActive: boolean;
    }>
  ): Promise<Reminder> {
    const { data, error } = await supabase
      .from('reminders')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.schedule !== undefined && { schedule: updates.schedule }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapFromDb(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
  },
};

function mapFromDb(row: any): Reminder {
  return {
    id: row.id,
    careRecipientId: row.care_recipient_id,
    createdBy: row.created_by,
    title: row.title,
    reminderType: row.reminder_type,
    schedule: row.schedule || {},
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
