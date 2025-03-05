
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';
import deTranslation from './locales/de/translation.json';

// Initialize i18next
i18n
  // Use backend plugin for loading translations from public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize configuration
  .init({
    // Default language
    fallbackLng: 'en',
    // Debug mode in development
    debug: import.meta.env.DEV,
    // Default namespace
    defaultNS: 'translation',
    // Resources for initial loading (will be used until backend loads translations)
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation },
      fr: { translation: frTranslation },
      de: { translation: deTranslation }
    },
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Backend configuration (for loading from public/locales)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Language detector settings
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],
      // Cache language in localStorage
      caches: ['localStorage'],
      // Local storage key
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
