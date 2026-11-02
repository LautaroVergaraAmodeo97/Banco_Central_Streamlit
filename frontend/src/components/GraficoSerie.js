/**
 * Gráfico de área de una serie temporal
 */

'use client'

import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatearCompacto, formatearFecha, formatearValor, reducirPuntos } from '@/lib/formato'

function TooltipSerie({ active, payload, unidad, mensual }) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload
  const formato = mensual ? { month: 'long', year: 'numeric' } : { day: '2-digit', month: 'long', year: 'numeric' }
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg text-sm">
      <p className="text-muted">{formatearFecha(punto.fecha, formato)}</p>
      <p className="font-semibold">
        {formatearValor(punto.valor)} <span className="font-normal text-muted">{unidad}</span>
      </p>
    </div>
  )
}

export default function GraficoSerie({ datos, color, unidad, mensual = false }) {
  // Cada gráfico necesita su propio id de degradado: si dos comparten el mismo,
  // el navegador usa el primero y el segundo se pinta con el color equivocado
  const idRelleno = `relleno-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  if (!datos.length) {
    return (
      <div className="h-80 grid place-items-center rounded-lg border border-dashed border-border text-muted">
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
    <div className="h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={puntos} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={idRelleno} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={(f) => formatearFecha(f, formatoEje)}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={48}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={formatearCompacto}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            content={<TooltipSerie unidad={unidad} mensual={mensual} />}
            cursor={{ stroke: 'var(--muted)', strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${idRelleno})`}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
