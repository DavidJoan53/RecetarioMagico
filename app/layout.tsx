import type {Metadata} from 'next'
import {NextIntlClientProvider} from 'next-intl'
import {getLocale, getTranslations} from 'next-intl/server'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app')
  return {title: t('name'), description: t('tagline')}
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /** Screen readers take pronunciation from lang, so it tracks the locale. */
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
