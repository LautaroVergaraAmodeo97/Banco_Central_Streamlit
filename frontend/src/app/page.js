/**
 * Página principal: portada, indicadores, calculadora de inflación y quiénes somos
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Hero from '@/components/Hero'
import PanelIndicadores from '@/components/PanelIndicadores'
import CalculadoraInflacion from '@/components/CalculadoraInflacion'
import Nosotros from '@/components/Nosotros'
import { obtenerResumen } from '@/services/api'

export default function Inicio() {
  const [resumen, setResumen] = useState(null)
  const [errorResumen, setErrorResumen] = useState(null)

  useEffect(() => {
    obtenerResumen()
      .then(setResumen)
      .catch((e) => setErrorResumen(e.message))
  }, [])

  const mayorista = errorResumen
    ? { error: errorResumen }
    : resumen?.find((i) => i.id === 'tipo-cambio-mayorista')

  return (
    <>
      <Hero mayorista={mayorista} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-24">
        <section id="indicadores" className="scroll-mt-40 sm:scroll-mt-24">
          <PanelIndicadores resumen={resumen} errorResumen={errorResumen} />
        </section>

        <section id="calculadora" className="scroll-mt-40 sm:scroll-mt-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Herramienta</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">Calculadora de inflación acumulada</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Convertí precios entre cualquier mes desde enero de 1992 y hoy. Escribí un monto en cualquiera de los
            dos campos y te mostramos su equivalente ajustado por inflación.
          </p>
          <div className="mt-6">
            <CalculadoraInflacion />
          </div>
        </section>

        <Nosotros />

        <section className="rounded-2xl bg-[#111827] text-white p-8 sm:p-12 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">¿Necesitás un análisis a medida?</h2>
            <p className="mt-2 text-lg text-[#cbd2dc]">
              Contanos sobre tu empresa o emprendimiento y te respondemos a la brevedad.
            </p>
          </div>
          <Link href="/contacto" className="inline-flex items-center min-h-12 px-6 rounded-lg bg-white text-[#111827] font-semibold hover:opacity-90">
            Escribinos
          </Link>
        </section>
      </div>
    </>
  )
}
