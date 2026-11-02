/**
 * Layout compartido - Aplica a todas las páginas
 */

import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Prognosis · Indicadores BCRA',
  description: 'Dashboard de indicadores económicos del Banco Central de la República Argentina',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Navbar />

        <main className="flex-1 w-full">
          {children}
        </main>

        <footer className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row gap-2 justify-between text-sm text-muted">
            <p>Fuentes: Banco Central de la República Argentina (BCRA) e INDEC</p>
            <p>© Prognosis</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
