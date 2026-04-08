import { create } from 'zustand';
import type { UserProfile } from '../types/user';
import { authService } from '../services/auth.service';

interface AuthStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      // Verify the session is actually valid by checking with the server
      const session = await authService.getSession();
      if (!session) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const profile = await authService.getProfile();
      if (!profile) {
        // Stale session — clear it
        await authService.signOut().catch(() => {});
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Clear any bad session state
      await authService.signOut().catch(() => {});
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    await authService.signIn(email, password);
    const profile = await authService.getProfile();
    set({ user: profile, isAuthenticated: true });
  },

  signUp: async (email, password, displayName) => {
    const result = await authService.signUp(email, password, displayName);

    // If no session (email confirmation enabled), auto sign-in
    if (!result.session) {
      try {
        await authService.signIn(email, password);
      } catch {
        // Email confirmation is required — user must confirm first
        throw new Error(
          'Account created! Please check your email to confirm, then log in.'
        );
      }
    }

    const profile = await authService.getProfile();
    set({ user: profile, isAuthenticated: true });
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
