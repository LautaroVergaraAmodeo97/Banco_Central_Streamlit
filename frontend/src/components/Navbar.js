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
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent text-white font-bold">P</span>
          <span className="font-semibold tracking-tight text-lg">Prognosis</span>
        </Link>

        <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
          {secciones.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2.5 sm:px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap text-muted hover:text-text hover:bg-surface-2"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contacto"
            aria-current={pathname === '/contacto' ? 'page' : undefined}
            className="ml-1 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap bg-accent text-white hover:opacity-90"
          >
            Contacto
          </Link>
        </nav>
      </div>
    </header>
  )
}
