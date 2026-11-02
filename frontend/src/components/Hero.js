/**
 * Portada: presentación de Prognosis y dato destacado del dólar mayorista
 */

'use client'

import Link from 'next/link'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import Variacion from '@/components/Variacion'
import { COLORES, formatearFecha, formatearValor } from '@/lib/formato'

function TarjetaDestacada({ indicador }) {
  const color = COLORES['tipo-cambio-mayorista']

  if (!indicador) {
    return <div className="h-72 rounded-2xl border border-border bg-surface-2 animate-pulse" />
  }
  if (indicador.error) {
    return (
      <div className="rounded-2xl border border-border bg-surface-2 p-6 text-sm text-muted">
        No se pudo cargar la cotización del dólar mayorista.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-6">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-muted">Dólar mayorista · Com. A 3500</p>
        <p className="text-xs text-muted">{formatearFecha(indicador.ultima_fecha)}</p>
      </div>
      <p className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">${formatearValor(indicador.ultimo_valor)}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Variacion valor={indicador.variacion_30d} sufijo="en 30 días" />
        <Variacion valor={indicador.variacion_1a} sufijo="en un año" />
      </div>
      <div className="h-24 mt-5 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={indicador.sparkline} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="relleno-hero" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Area type="monotone" dataKey="valor" stroke={color} strokeWidth={2} fill="url(#relleno-hero)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-muted">Últimos 12 meses · ARS por USD</p>
    </div>
  )
}

export default function Hero({ mayorista }) {
  return (
    <section id="inicio" className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid gap-12 lg:grid-cols-[1.25fr_1fr] items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Consultora económica · Datos oficiales del BCRA
          </p>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight">
            Decisiones económicas respaldadas por datos confiables.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Somos Prognosis, una consultora que asesora a empresas y emprendimientos en sus decisiones económicas.
            Seguimos a diario los indicadores del Banco Central y los convertimos en análisis claros para tu negocio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#indicadores" className="inline-flex items-center min-h-12 px-5 rounded-lg bg-accent text-white font-semibold hover:opacity-90">
              Ver indicadores
            </a>
            <Link href="/contacto" className="inline-flex items-center min-h-12 px-5 rounded-lg border border-border font-semibold hover:bg-surface-2">
              Hablemos de tu empresa
            </Link>
          </div>
        </div>
        <TarjetaDestacada indicador={mayorista} />
      </div>
    </section>
  )
}
