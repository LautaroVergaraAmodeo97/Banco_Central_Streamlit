/**
 * Página principal: portada, lectura del día, herramientas y quiénes somos
 */

'use client'

import Link from 'next/link'
import Hero from '@/components/Hero'
import LecturaDelDia from '@/components/LecturaDelDia'
import Nosotros from '@/components/Nosotros'
import QuienSoy from '@/components/QuienSoy'
import { useResumenBCRA, useResumenIndec } from '@/lib/datos'

const HERRAMIENTAS = [
  { href: '/mercado', titulo: 'Mercado', texto: 'Dólar, reservas, tasas, base monetaria y tipo de cambio real, con series desde 1996.' },
  { href: '/indec', titulo: 'Estadísticas del INDEC', texto: 'Inflación, actividad, salarios, canastas, pobreza, empleo y comercio exterior.' },
  { href: '/inflacion', titulo: 'Calculadora de inflación', texto: 'Actualizá cualquier monto entre dos meses desde enero de 1992.' },
]

export default function Inicio() {
  const { datos: bcra, error } = useResumenBCRA()
  const { datos: indec } = useResumenIndec()
  const mayorista = error ? { error } : bcra?.find((i) => i.id === 'tipo-cambio-mayorista')

  return (
    <>
      <Hero mayorista={mayorista} />

      {error ? (
        <div className="contenedor py-10">
          <p className="border border-neg/40 bg-neg-soft p-5 text-neg">
            No se pudo conectar con la API. Verificá que el backend esté corriendo: <code className="font-mono">uvicorn app:app --reload</code>{' '}
            en la carpeta <code className="font-mono">backend</code>.
          </p>
        </div>
      ) : (
        <LecturaDelDia bcra={bcra} indec={indec} />
      )}

      <section className="border-y border-border bg-surface">
        <div className="contenedor grid md:grid-cols-3">
          {HERRAMIENTAS.map((h, i) => (
            <Link
              key={h.href}
              href={h.href}
              className={`group flex flex-col gap-3 py-8 md:px-8 ${i ? 'border-t border-border md:border-t-0 md:border-l' : 'md:pl-0'}`}
            >
              <span className="flex items-center justify-between gap-3 font-display text-xl font-semibold">
                {h.titulo}
                <span aria-hidden="true" className="text-signal transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
              </span>
              <span className="text-muted">{h.texto}</span>
            </Link>
          ))}
        </div>
      </section>

      <Nosotros />
      <QuienSoy />
    </>
  )
}
