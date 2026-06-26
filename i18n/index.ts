import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

export const defaultLanguage = 'es'

export const resources = {
  en: {translation: en},
  es: {translation: es},
} as const

export const supportedLanguages = Object.keys(resources)

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  interpolation: {
    // React already escapes values, so i18next doesn't need to.
    escapeValue: false,
  },
})

export default i18n
