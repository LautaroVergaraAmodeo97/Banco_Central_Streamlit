/**
 * Gráfico de área de una serie temporal, con el trazo en el degradado de la marca
 */

'use client'

import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatearCompacto, formatearFecha, formatearValor, reducirPuntos } from '@/lib/formato'

const TICKS = { fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }

function TooltipSerie({ active, payload, unidad, mensual }) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload
  const formato = mensual ? { month: 'long', year: 'numeric' } : { day: '2-digit', month: 'long', year: 'numeric' }
  return (
    <div className="panel px-3 py-2 text-sm shadow-xl">
      <p className="etiqueta">{formatearFecha(punto.fecha, formato)}</p>
      <p className="cifra mt-0.5 text-base font-medium">
        {formatearValor(punto.valor)} <span className="text-xs text-muted">{unidad}</span>
      </p>
    </div>
  )
}

export default function GraficoSerie({ datos, unidad, mensual = false, alto = 'h-72 sm:h-80' }) {
  // Cada gráfico necesita sus propios ids de degradado: si dos comparten uno,
  // el navegador usa el primero y el segundo se pinta mal
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  if (!datos.length) {
    return (
      <div className={`${alto} grid place-items-center border border-dashed border-border text-muted`}>
        No hay datos para el período seleccionado
      </div>
    )
  }

  const puntos = reducirPuntos(datos)
  const diasRango = (new Date(datos.at(-1).fecha) - new Date(datos[0].fecha)) / 86400000
  const formatoEje =
    diasRango <= 93 && !mensual ? { day: '2-digit', month: 'short' }
    : diasRango <= 2200 ? { month: 'short', year: '2-digit' }
    : { year: 'numeric' }

  return (
    <div className={alto}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={puntos} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`trazo-${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0b8bff" />
              <stop offset="100%" stopColor="#13f2a1" />
            </linearGradient>
            <linearGradient id={`relleno-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16c9de" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#16c9de" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="2 4" />
          <XAxis
            dataKey="fecha"
            tickFormatter={(f) => formatearFecha(f, formatoEje)}
            tick={TICKS}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={44}
          />
          <YAxis domain={['auto', 'auto']} tickFormatter={formatearCompacto} tick={TICKS} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            content={<TooltipSerie unidad={unidad} mensual={mensual} />}
            cursor={{ stroke: 'var(--signal)', strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke={`url(#trazo-${id})`}
            strokeWidth={2}
            fill={`url(#relleno-${id})`}
            activeDot={{ r: 4, fill: 'var(--signal)', strokeWidth: 0 }}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
