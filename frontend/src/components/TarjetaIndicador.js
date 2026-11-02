/**
 * Tarjeta de resumen de un indicador: último valor, variación y sparkline
 */

'use client'

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { COLORES, formatearFecha, formatearValor } from '@/lib/formato'
import Variacion from '@/components/Variacion'

export default function TarjetaIndicador({ indicador, seleccionada, onSeleccionar }) {
  const color = COLORES[indicador.id]

  return (
    <button
      type="button"
      onClick={onSeleccionar}
      aria-pressed={seleccionada}
      className={`text-left rounded-xl border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        seleccionada ? 'border-accent ring-2 ring-accent/30' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="truncate">{indicador.nombre}</span>
      </div>

      {indicador.error ? (
        <p className="mt-3 text-sm text-neg">{indicador.error}</p>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatearValor(indicador.ultimo_valor)}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="truncate">{indicador.unidad}</span>
            <Variacion valor={indicador.variacion_30d} sufijo="30d" />
          </div>

          <div className="h-10 mt-3 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={indicador.sparkline} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${indicador.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#spark-${indicador.id})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-2 text-xs text-muted">Al {formatearFecha(indicador.ultima_fecha)}</p>
        </>
      )}
    </button>
  )
}
