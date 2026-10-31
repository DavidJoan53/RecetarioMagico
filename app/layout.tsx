import type {Metadata} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recetario Mágico',
  description: 'Mis recetas, etiquetadas y fáciles de encontrar.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  // lang is Spanish because the content is: screen readers pick pronunciation
  // from it, so getting this wrong degrades the experience it exists to serve.
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
