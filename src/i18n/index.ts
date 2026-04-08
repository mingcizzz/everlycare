import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

const resources = {
  'zh-CN': { translation: zhCN },
  en: { translation: en },
};

// Detect if device language is Chinese
const deviceLocale = Localization.getLocales()[0]?.languageTag ?? 'en';
const defaultLanguage = deviceLocale.startsWith('zh') ? 'zh-CN' : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
