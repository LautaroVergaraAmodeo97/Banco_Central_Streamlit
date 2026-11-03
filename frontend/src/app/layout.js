/**
 * Layout compartido - Aplica a todas las páginas
 */

import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans, Orbitron } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Marca from '@/components/Marca'

const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' })
const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-chakra' })
// Tipografía del logo: solo para la marca, no para textos
const orbitron = Orbitron({ subsets: ['latin'], weight: ['700'], variable: '--font-orbitron' })

export const metadata = {
  title: 'Prognosis · Indicadores BCRA',
  description: 'Data, tecnología de predicción e insights: indicadores económicos del Banco Central de la República Argentina',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable} ${chakra.variable} ${orbitron.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Navbar />

        <main className="flex-1 w-full">
          {children}
        </main>

        <footer className="border-t border-border">
          <div className="contenedor flex flex-wrap items-end justify-between gap-6 py-8">
            <Marca />
            <p className="cifra max-w-md text-[12px] text-muted sm:text-right">
              Fuentes: Banco Central de la República Argentina e INDEC. © Prognosis
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
