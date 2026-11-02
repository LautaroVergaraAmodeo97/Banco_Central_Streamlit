/**
 * Navbar - Marca y menú de navegación
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Secciones de la página principal
const secciones = [
  { href: '/#indicadores', label: 'Indicadores' },
  { href: '/#calculadora', label: 'Calculadora' },
  { href: '/#nosotros', label: 'Quiénes somos' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    // Barra siempre oscura: es el fondo del logo de Prognosis, en modo claro y oscuro
    <header className="sticky top-0 z-10 border-b border-white/10 bg-marca-fondo/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" aria-label="Prognosis, inicio" className="flex flex-col shrink-0 leading-none">
          <span className="w-fit texto-marca font-marca font-bold text-xl sm:text-2xl tracking-wider">PROGNOSIS</span>
          <span className="hidden sm:block mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#b2e0f8]">
            Data, tecnología de predicción &amp; insights
          </span>
        </Link>

        <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
          {secciones.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2.5 sm:px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap text-[#b2e0f8] hover:text-white hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contacto"
            aria-current={pathname === '/contacto' ? 'page' : undefined}
            className="ml-1 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap text-marca-fondo bg-linear-to-r from-[#0b8bff] to-[#13f2a1] hover:opacity-90"
          >
            Contacto
          </Link>
        </nav>
      </div>
    </header>
  )
}
