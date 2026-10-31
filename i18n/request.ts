import {getRequestConfig} from 'next-intl/server'

export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

/** Single locale for now; a switcher would read a cookie here. */
export default getRequestConfig(async () => {
  const locale = defaultLocale
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
