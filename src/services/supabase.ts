import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://ypzlcrhriqcvgszxprbh.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwemxjcmhyaXFjdmdzenhwcmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTE1NTYsImV4cCI6MjA5MDgyNzU1Nn0.pPUfEBnl_jCVCvIVJEd4udAnloHoDIaiAJ1PP0PvhBE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
