import { supabase } from './supabase';
import type { CareRecipient } from '../types/recipient';

export const recipientService = {
  async create(recipient: Omit<CareRecipient, 'id' | 'createdBy' | 'createdAt'>): Promise<CareRecipient> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    const user = session.user;

    const { data, error } = await supabase
      .from('care_recipients')
      .insert({
        name: recipient.name,
        date_of_birth: recipient.dateOfBirth,
        gender: recipient.gender,
        medical_conditions: recipient.medicalConditions,
        allergies: recipient.allergies,
        notes: recipient.notes,
        avatar_url: recipient.avatarUrl,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as primary caregiver
    await supabase.from('care_team_members').insert({
      care_recipient_id: data.id,
      user_id: user.id,
      role: 'primary',
      accepted_at: new Date().toISOString(),
    });

    return mapFromDb(data);
  },

  async getAll(): Promise<CareRecipient[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get recipients where user is a team member
    const { data: teamEntries, error: teamError } = await supabase
      .from('care_team_members')
      .select('care_recipient_id')
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null);

    if (teamError) throw teamError;

    const recipientIds = (teamEntries || []).map((t) => t.care_recipient_id);
    if (recipientIds.length === 0) return [];

    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .in('id', recipientIds);

    if (error) throw error;
    return (data || []).map(mapFromDb);
  },

  async getById(id: string): Promise<CareRecipient | null> {
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return mapFromDb(data);
  },

  async update(id: string, updates: Partial<Omit<CareRecipient, 'id' | 'createdBy' | 'createdAt'>>) {
    const { error } = await supabase
      .from('care_recipients')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.dateOfBirth !== undefined && { date_of_birth: updates.dateOfBirth }),
        ...(updates.gender !== undefined && { gender: updates.gender }),
        ...(updates.medicalConditions && { medical_conditions: updates.medicalConditions }),
        ...(updates.allergies && { allergies: updates.allergies }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.avatarUrl !== undefined && { avatar_url: updates.avatarUrl }),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('care_recipients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

function mapFromDb(row: any): CareRecipient {
  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    medicalConditions: row.medical_conditions || [],
    allergies: row.allergies || [],
    notes: row.notes,
    avatarUrl: row.avatar_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
