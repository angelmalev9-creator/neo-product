import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import bg from './locales/bg.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  'BG': 'bg', 'RU': 'ru', 'BY': 'ru', 'KZ': 'ru', 'UA': 'ru', 'MD': 'ru',
  'KG': 'ru', 'TJ': 'ru', 'UZ': 'ru', 'TM': 'ru', 'AM': 'ru', 'AZ': 'ru', 'GE': 'ru',
};

export const SUPPORTED_LANGUAGES = ['bg', 'en', 'ru'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = { bg: 'Български', en: 'English', ru: 'Русский' };
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = { bg: 'BG', en: 'EN', ru: 'RU' };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { bg: { translation: bg }, en: { translation: en }, ru: { translation: ru } },
    fallbackLng: 'bg',
    lng: 'bg',
    supportedLngs: SUPPORTED_LANGUAGES,
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'neo_language' },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export const detectLanguageFromIP = async (): Promise<SupportedLanguage> => {
  try {
    const savedLang = localStorage.getItem('neo_language');
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang as SupportedLanguage)) return savedLang as SupportedLanguage;
    const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Failed to fetch IP info');
    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();
    if (countryCode && COUNTRY_TO_LANGUAGE[countryCode]) {
      const detectedLang = COUNTRY_TO_LANGUAGE[countryCode] as SupportedLanguage;
      localStorage.setItem('neo_language', detectedLang);
      return detectedLang;
    }
    return 'en';
  } catch { return 'bg'; }
};

export const changeLanguage = async (lang: SupportedLanguage, saveToProfile = true) => {
  localStorage.setItem('neo_language', lang);
  await i18n.changeLanguage(lang);
  if (saveToProfile) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { /* future: save to profile */ }
    } catch {}
  }
};

export default i18n;
