/**
 * Encabezado: marca, secciones y cinta de cotizaciones
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Marca from '@/components/Marca'
import Cinta from '@/components/Cinta'

const secciones = [
  { href: '/', label: 'Inicio' },
  { href: '/mercado', label: 'Mercado' },
  { href: '/indec', label: 'INDEC' },
  { href: '/inflacion', label: 'Inflación' },
  { href: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky z-50 border-b border-border bg-bg/90 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="contenedor flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
        <Link href="/" aria-label="Prognosis, inicio">
          <Marca />
        </Link>

        <nav aria-label="Secciones" className="-mx-1 flex flex-wrap">
          {secciones.map((s) => {
            const activa = pathname === s.href
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={activa ? 'page' : undefined}
                className={`relative whitespace-nowrap px-3 py-2.5 font-display text-[15px] font-medium transition-colors ${
                  activa ? 'text-text' : 'text-muted hover:text-text'
                }`}
              >
                {s.label}
                {activa && <span className="linea-senal absolute inset-x-3 bottom-0 h-[2px]" />}
              </Link>
            )
          })}
        </nav>
      </div>
      <Cinta />
    </header>
  )
}
