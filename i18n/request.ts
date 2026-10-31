import {getRequestConfig} from 'next-intl/server'

/**
 * Locales the app ships translations for. Spanish is the default because the
 * content is Spanish; English exists so the UI can be read by someone who
 * isn't.
 */
export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

export default getRequestConfig(async () => {
  // Single-user app, so there is no locale negotiation to do yet. When a
  // switcher arrives this reads the choice from a cookie; the URL stays clean
  // because there is no second audience to route between.
  const locale = defaultLocale
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
