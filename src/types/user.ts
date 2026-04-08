export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  language: 'zh-CN' | 'en';
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
