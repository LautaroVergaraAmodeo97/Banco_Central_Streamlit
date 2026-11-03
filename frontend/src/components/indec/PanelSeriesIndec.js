/**
 * Series clave del INDEC: pestañas por tema, lista de series y gráfico de la elegida
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import GraficoSerie from '@/components/GraficoSerie'
import Mini from '@/components/Mini'
import { obtenerSerieIndec } from '@/services/api'
import { useResumenIndec } from '@/lib/datos'
import { formatearConUnidad } from '@/lib/formato'
import { describirCambio, formatearPeriodo } from '@/lib/periodos'

const RANGOS = [
  { id: '2a', label: '2A', meses: 24 },
  { id: '5a', label: '5A', meses: 60 },
  { id: 'max', label: 'Máx', meses: null },
]

export default function PanelSeriesIndec() {
  const { datos: resumen, error } = useResumenIndec()
  const [grupo, setGrupo] = useState('Precios')
  const [seleccion, setSeleccion] = useState('ipc-mensual')
  const [detalles, setDetalles] = useState({})
  const [errores, setErrores] = useState({})
  const [rango, setRango] = useState('5a')

  useEffect(() => {
    if (detalles[seleccion] || errores[seleccion]) return
    obtenerSerieIndec(seleccion)
      .then((d) => setDetalles((prev) => ({ ...prev, [seleccion]: d })))
      .catch((e) => setErrores((prev) => ({ ...prev, [seleccion]: e.message })))
  }, [seleccion, detalles, errores])

  const grupos = useMemo(() => [...new Set((resumen ?? []).map((s) => s.grupo))], [resumen])
  const detalle = detalles[seleccion]
  const meta = resumen?.find((s) => s.id === seleccion) ?? detalle
  const datos = useMemo(() => {
    if (!detalle) return []
    const { meses } = RANGOS.find((r) => r.id === rango)
    // Las series no mensuales tienen pocos puntos: siempre se muestran completas
    if (!meses || detalle.frecuencia !== 'mensual') return detalle.datos
    return detalle.datos.slice(-meses)
  }, [detalle, rango])

  const elegirGrupo = (g) => {
    setGrupo(g)
    setSeleccion(resumen.find((s) => s.grupo === g).id)
  }

  if (error) return <p className="border border-neg/40 bg-neg-soft p-5 text-neg">{error}</p>

  return (
    <div>
      <div role="group" aria-label="Temas" className="flex flex-wrap gap-1 border border-border p-1">
        {(grupos.length ? grupos : ['Precios']).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={g === grupo}
            onClick={() => resumen && elegirGrupo(g)}
            className={`px-3 py-1.5 font-display text-[15px] font-medium ${g === grupo ? 'bg-accent text-on-accent' : 'text-muted hover:text-text'}`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <ul className="border-t border-border lg:col-span-4">
          {!resumen
            ? Array.from({ length: 4 }, (_, i) => <li key={i} className="h-[4.25rem] animate-pulse border-b border-border bg-surface" />)
            : resumen.filter((s) => s.grupo === grupo).map((s) => {
                const activo = s.id === seleccion
                const cambio = s.error ? null : describirCambio(s.ultimo_valor, s.valor_anterior, s.unidad)
                return (
                  <li key={s.id} className="border-b border-border">
                    <button
                      type="button"
                      onClick={() => setSeleccion(s.id)}
                      aria-pressed={activo}
                      className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3.5 text-left ${activo ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-medium">
                          {activo && <span className="linea-senal h-3 w-[3px]" />}
                          {s.nombre}
                        </span>
                        <span className="cifra block text-[12px] text-muted">
                          {s.error ? 'Sin datos' : formatearPeriodo(s.ultima_fecha, s.frecuencia)}
                          {cambio && ` · ${cambio.texto}`}
                        </span>
                      </span>
                      {!s.error && (
                        <span className="flex items-center gap-3">
                          <Mini valores={s.sparkline?.map((p) => p.valor)} className="hidden h-6 w-16 sm:block" />
                          <span className="cifra font-medium">{formatearConUnidad(s.ultimo_valor, s.unidad)}</span>
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
        </ul>

        <div className="panel p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold">{meta?.nombre ?? '…'}</h2>
              <p className="text-sm text-muted">{meta?.descripcion}</p>
            </div>
            {detalle?.frecuencia === 'mensual' && (
              <div role="group" aria-label="Período" className="flex border border-border p-0.5">
                {RANGOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRango(r.id)}
                    aria-pressed={rango === r.id}
                    className={`h-8 px-3 font-mono text-xs ${rango === r.id ? 'bg-accent text-on-accent' : 'text-muted hover:text-text'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-6">
            {errores[seleccion] ? (
              <p className="text-neg">{errores[seleccion]}</p>
            ) : detalle ? (
              <GraficoSerie datos={datos} unidad={detalle.unidad} mensual />
            ) : (
              <div className="grid h-80 place-items-center text-muted">Cargando serie…</div>
            )}
          </div>
          {detalle && datos.length > 0 && (
            <p className="etiqueta mt-3">
              {formatearPeriodo(datos[0].fecha, detalle.frecuencia)} a {formatearPeriodo(datos.at(-1).fecha, detalle.frecuencia)} · fuente INDEC
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
