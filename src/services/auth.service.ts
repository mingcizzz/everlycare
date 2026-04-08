import { supabase } from './supabase';
import type { UserProfile } from '../types/user';

export const authService = {
  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;

    // If email confirmation is enabled, data.session will be null.
    // The DB trigger handles profile creation automatically.
    // We don't manually insert — the trigger + SECURITY DEFINER handles it.

    // If no session returned, the user needs to confirm email first
    if (!data.session) {
      // Email confirmation may be required — session will be established after confirmation
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getProfile(): Promise<UserProfile | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const user = session.user;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // If profiles query fails (RLS, table missing, etc.), build from auth metadata
    if (error || !data) {
      return {
        id: user.id,
        displayName: user.user_metadata?.display_name || 'User',
        language: 'zh-CN',
        createdAt: user.created_at,
      };
    }

    return {
      id: data.id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      language: data.language,
      createdAt: data.created_at,
    };
  },

  async updateProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'language' | 'avatarUrl'>>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        language: updates.language,
        avatar_url: updates.avatarUrl,
      })
      .eq('id', session.user.id);

    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
