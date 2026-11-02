import type {Metadata} from 'next'
import {Figtree} from 'next/font/google'
import {NextIntlClientProvider} from 'next-intl'
import {getLocale, getTranslations} from 'next-intl/server'
import {Providers} from './providers'
import './globals.css'

/** Variable, so semibold and bold come from the same file as regular. */
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
})

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
    <html lang={locale} className={figtree.variable}>
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
