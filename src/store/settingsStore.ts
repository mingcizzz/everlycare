import { create } from 'zustand';
import i18n from '../i18n';

interface SettingsStore {
  language: 'zh-CN' | 'en';
  setLanguage: (lang: 'zh-CN' | 'en') => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: (i18n.language as 'zh-CN' | 'en') || 'zh-CN',

  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
