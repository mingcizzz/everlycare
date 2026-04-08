import { supabase } from './supabase';
import type { CareTeamMember } from '../types/recipient';

export interface ActivityFeedItem {
  id: string;
  logType: string;
  occurredAt: string;
  notes?: string;
  loggedByName: string;
  loggedByAvatar?: string;
}

export const careTeamService = {
  async getMembers(careRecipientId: string): Promise<CareTeamMember[]> {
    const { data, error } = await supabase
      .from('care_team_members')
      .select(`
        *,
        profiles:user_id (display_name, avatar_url)
      `)
      .eq('care_recipient_id', careRecipientId)
      .order('role', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      careRecipientId: row.care_recipient_id,
      userId: row.user_id,
      role: row.role,
      displayName: row.profiles?.display_name || undefined,
      avatarUrl: row.profiles?.avatar_url || undefined,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at,
    }));
  },

  async inviteMemberByEmail(
    careRecipientId: string,
    email: string,
    role: CareTeamMember['role'] = 'member'
  ): Promise<void> {
    // Look up user by email via profiles (requires matching auth)
    // For MVP, we find the user in auth and add them
    const { data: users, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // In a real app, this would use Supabase Edge Function to send an invite link.
    // For now, we use a simplified approach: lookup by a custom invite code flow.
    // The invited user would share their user ID directly.

    // Simplified: create a pending team membership
    // The invited user's ID must be provided directly for MVP
    throw new Error('Email-based invite requires Edge Function. Use user ID for MVP.');
  },

  async inviteMemberById(
    careRecipientId: string,
    userId: string,
    role: CareTeamMember['role'] = 'member'
  ): Promise<CareTeamMember> {
    const { data, error } = await supabase
      .from('care_team_members')
      .insert({
        care_recipient_id: careRecipientId,
        user_id: userId,
        role,
        // Not accepted yet — the invited user must accept
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      careRecipientId: data.care_recipient_id,
      userId: data.user_id,
      role: data.role,
      invitedAt: data.invited_at,
      acceptedAt: data.accepted_at,
    };
  },

  async acceptInvite(teamMemberId: string): Promise<void> {
    const { error } = await supabase
      .from('care_team_members')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', teamMemberId);

    if (error) throw error;
  },

  async removeMember(teamMemberId: string): Promise<void> {
    const { error } = await supabase
      .from('care_team_members')
      .delete()
      .eq('id', teamMemberId);

    if (error) throw error;
  },

  async updateRole(
    teamMemberId: string,
    role: CareTeamMember['role']
  ): Promise<void> {
    const { error } = await supabase
      .from('care_team_members')
      .update({ role })
      .eq('id', teamMemberId);

    if (error) throw error;
  },

  async getActivityFeed(
    careRecipientId: string,
    limit: number = 30
  ): Promise<ActivityFeedItem[]> {
    const { data, error } = await supabase
      .from('care_logs')
      .select(`
        id,
        log_type,
        occurred_at,
        notes,
        profiles:logged_by (display_name, avatar_url)
      `)
      .eq('care_recipient_id', careRecipientId)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      logType: row.log_type,
      occurredAt: row.occurred_at,
      notes: row.notes,
      loggedByName: row.profiles?.display_name || 'Unknown',
      loggedByAvatar: row.profiles?.avatar_url || undefined,
    }));
  },

  async getPendingInvites(userId: string): Promise<CareTeamMember[]> {
    const { data, error } = await supabase
      .from('care_team_members')
      .select('*')
      .eq('user_id', userId)
      .is('accepted_at', null);

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      careRecipientId: row.care_recipient_id,
      userId: row.user_id,
      role: row.role,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at,
    }));
  },
};
