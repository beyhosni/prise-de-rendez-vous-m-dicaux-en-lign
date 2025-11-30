import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';

// Initialisation de i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: fr
      },
      en: {
        translation: en
      }
    },
    lng: localStorage.getItem('language') || 'fr', // Langue par défaut
    fallbackLng: 'fr', // Langue de secours
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
