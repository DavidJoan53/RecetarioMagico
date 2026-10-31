import type {Metadata} from 'next'
import {NextIntlClientProvider} from 'next-intl'
import {getLocale} from 'next-intl/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recetario Mágico',
  description: 'Mis recetas, etiquetadas y fáciles de encontrar.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // lang comes from the active locale rather than a hardcoded string: screen
  // readers pick pronunciation from it, so a wrong value degrades exactly the
  // experience the attribute exists to serve.
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
