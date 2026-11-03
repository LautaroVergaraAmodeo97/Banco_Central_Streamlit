/**
 * Portada: la tesis de Prognosis y la señal del día (dólar mayorista)
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GraficoSerie from '@/components/GraficoSerie'
import { obtenerSerie } from '@/services/api'
import { formatearFecha, formatearValor, formatearVariacion } from '@/lib/formato'

function SenalDelDia({ mayorista }) {
  const [serie, setSerie] = useState(null)

  useEffect(() => {
    const haceUnAnio = new Date()
    haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1)
    obtenerSerie('tipo-cambio-mayorista', haceUnAnio.toISOString().slice(0, 10))
      .then((s) => setSerie(s.datos))
      .catch(() => setSerie([]))
  }, [])

  if (!mayorista) return <div className="panel h-80 animate-pulse" />
  if (mayorista.error) {
    return <div className="panel p-6 text-sm text-muted">No se pudo cargar la cotización del dólar mayorista.</div>
  }

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="etiqueta">Dólar mayorista · Com. A 3500</p>
          <p className="cifra mt-2 text-[2.6rem] font-medium leading-none">${formatearValor(mayorista.ultimo_valor)}</p>
        </div>
        <dl className="cifra grid grid-cols-2 gap-x-5 gap-y-1 text-right text-sm">
          <dt className="text-muted">30 días</dt>
          <dd className="text-signal">{formatearVariacion(mayorista.variacion_30d)}</dd>
          <dt className="text-muted">12 meses</dt>
          <dd className="text-signal">{formatearVariacion(mayorista.variacion_1a)}</dd>
        </dl>
      </div>
      <div className="mt-5">
        {serie ? <GraficoSerie datos={serie} unidad="ARS por USD" alto="h-56" /> : <div className="h-56 animate-pulse bg-surface-2" />}
      </div>
      <p className="etiqueta mt-3">Último dato {formatearFecha(mayorista.ultima_fecha)} · ARS por USD · fuente BCRA</p>
    </div>
  )
}

export default function Hero({ mayorista }) {
  return (
    <section className="fondo-grilla border-b border-border">
      <div className="contenedor grid gap-10 py-14 lg:grid-cols-12 lg:py-20">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="etiqueta">Consultora económica · Argentina</p>
          <h1 className="mt-4 text-[clamp(2.3rem,5vw,3.6rem)] font-semibold leading-[1.02]">
            Datos oficiales de la economía argentina, leídos para decidir.
          </h1>
          <p className="mt-5 max-w-[34rem] text-[17px] text-muted">
            Prognosis asesora a empresas y emprendimientos con datos confiables y análisis detallados. Seguimos cada día
            al Banco Central y al INDEC para que planifiques precios, costos e inversiones con información, no con intuición.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/mercado" className="inline-flex min-h-11 items-center bg-accent px-6 font-display text-[15px] font-semibold text-on-accent hover:opacity-90">
              Ver el mercado
            </Link>
            <Link href="/contacto" className="inline-flex min-h-11 items-center border border-border px-6 font-display text-[15px] font-semibold hover:bg-surface-2">
              Hablar con un analista
            </Link>
          </div>
        </div>
        <div className="lg:col-span-6">
          <SenalDelDia mayorista={mayorista} />
        </div>
      </div>
    </section>
  )
}
