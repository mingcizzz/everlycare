import { supabase } from './supabase';
import type { Medication } from '../types/recipient';

export const medicationService = {
  async getAll(careRecipientId: string): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFromDb);
  },

  async create(
    careRecipientId: string,
    name: string,
    dosage: string | undefined,
    frequency: Medication['frequency'],
    scheduleTimes: string[]
  ): Promise<Medication> {
    const { data, error } = await supabase
      .from('medications')
      .insert({
        care_recipient_id: careRecipientId,
        name,
        dosage,
        frequency,
        schedule_times: scheduleTimes,
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
      name: string;
      dosage: string;
      frequency: Medication['frequency'];
      scheduleTimes: string[];
      isActive: boolean;
    }>
  ): Promise<Medication> {
    const { data, error } = await supabase
      .from('medications')
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.dosage !== undefined && { dosage: updates.dosage }),
        ...(updates.frequency !== undefined && { frequency: updates.frequency }),
        ...(updates.scheduleTimes !== undefined && {
          schedule_times: updates.scheduleTimes,
        }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapFromDb(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) throw error;
  },
};

function mapFromDb(row: any): Medication {
  return {
    id: row.id,
    careRecipientId: row.care_recipient_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    scheduleTimes: row.schedule_times || [],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
