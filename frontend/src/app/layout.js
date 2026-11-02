/**
 * Layout compartido - Aplica a todas las páginas
 */

import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
// Tipografía del logo: solo para la marca, no para textos
const orbitron = Orbitron({ subsets: ['latin'], weight: ['700'], variable: '--font-orbitron' })

export const metadata = {
  title: 'Prognosis · Indicadores BCRA',
  description: 'Data, tecnología de predicción e insights: indicadores económicos del Banco Central de la República Argentina',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${orbitron.variable}`}>
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
