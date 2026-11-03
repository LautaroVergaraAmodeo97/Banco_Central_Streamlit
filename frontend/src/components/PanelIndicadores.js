/**
 * Mercado: lista de indicadores del BCRA y detalle de la serie elegida
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import GraficoSerie from '@/components/GraficoSerie'
import { obtenerSerie } from '@/services/api'
import { useResumenBCRA } from '@/lib/datos'
import { formatearFecha, formatearValor, formatearVariacion, parsearFecha } from '@/lib/formato'

const RANGOS = [
  { id: '1m', label: '1M', dias: 30 },
  { id: '3m', label: '3M', dias: 91 },
  { id: '6m', label: '6M', dias: 182 },
  { id: '1a', label: '1A', dias: 365 },
  { id: '5a', label: '5A', dias: 1826 },
  { id: 'max', label: 'Máx', dias: null },
  { id: 'custom', label: 'Fechas', dias: null },
]

function aISO(fecha) {
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${m}-${d}`
}

function descargarCSV(nombre, datos) {
  const contenido = ['fecha,valor', ...datos.map((p) => `${p.fecha},${p.valor}`)].join('\n')
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${nombre}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const CAMPO_FECHA = 'h-10 border border-border bg-surface px-3 cifra text-sm'

export default function PanelIndicadores() {
  const { datos: resumen, error: errorResumen } = useResumenBCRA()
  const [seleccion, setSeleccion] = useState('tipo-cambio-mayorista')
  const [series, setSeries] = useState({})
  const [erroresSerie, setErroresSerie] = useState({})
  const [rango, setRango] = useState('1a')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  // Las series se piden una sola vez completas y se filtran en el navegador
  useEffect(() => {
    if (series[seleccion] || erroresSerie[seleccion]) return
    obtenerSerie(seleccion)
      .then((s) => setSeries((prev) => ({ ...prev, [seleccion]: s })))
      .catch((e) => setErroresSerie((prev) => ({ ...prev, [seleccion]: e.message })))
  }, [seleccion, series, erroresSerie])

  const serie = series[seleccion]
  const errorSerie = erroresSerie[seleccion]
  const meta = resumen?.find((i) => i.id === seleccion) ?? serie

  const datosFiltrados = useMemo(() => {
    if (!serie) return []
    const datos = serie.datos
    if (rango === 'custom') {
      return datos.filter((p) => (!desde || p.fecha >= desde) && (!hasta || p.fecha <= hasta))
    }
    const { dias } = RANGOS.find((r) => r.id === rango)
    if (!dias || !datos.length) return datos
    const corte = parsearFecha(datos.at(-1).fecha)
    corte.setDate(corte.getDate() - dias)
    const corteISO = aISO(corte)
    return datos.filter((p) => p.fecha >= corteISO)
  }, [serie, rango, desde, hasta])

  const estadisticas = useMemo(() => {
    if (!datosFiltrados.length) return null
    const valores = datosFiltrados.map((p) => p.valor)
    return [
      ['Último', formatearValor(valores.at(-1))],
      ['Mínimo', formatearValor(Math.min(...valores))],
      ['Máximo', formatearValor(Math.max(...valores))],
      ['Var. del período', formatearVariacion(valores[0] ? (valores.at(-1) / valores[0] - 1) * 100 : null)],
    ]
  }, [datosFiltrados])

  function elegirRango(id) {
    if (id === 'custom' && serie && !desde && !hasta && datosFiltrados.length) {
      setDesde(datosFiltrados[0].fecha)
      setHasta(datosFiltrados.at(-1).fecha)
    }
    setRango(id)
  }

  if (errorResumen) {
    return (
      <p className="border border-neg/40 bg-neg-soft p-5 text-neg">
        No se pudo conectar con la API. Verificá que el backend esté corriendo: <code className="font-mono">uvicorn app:app --reload</code>{' '}
        en la carpeta <code className="font-mono">backend</code>.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Selector: lista de instrumentos */}
        <ul className="border-t border-border lg:col-span-4">
          {(resumen ?? Array.from({ length: 6 }, (_, i) => ({ id: `cargando-${i}` }))).map((r) => {
            if (!r.nombre) return <li key={r.id} className="h-[4.25rem] animate-pulse border-b border-border bg-surface" />
            const activo = r.id === seleccion
            return (
              <li key={r.id} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setSeleccion(r.id)}
                  aria-pressed={activo}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3.5 text-left transition-colors ${
                    activo ? 'bg-accent-soft' : 'hover:bg-surface-2'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-medium">
                      {activo && <span className="linea-senal h-3 w-[3px]" />}
                      {r.nombre}
                    </span>
                    <span className="block truncate text-[12.5px] text-muted">{r.unidad}</span>
                  </span>
                  {r.error ? (
                    <span className="text-xs text-neg">Sin datos</span>
                  ) : (
                    <span className="text-right">
                      <span className="cifra block font-medium">{formatearValor(r.ultimo_valor)}</span>
                      <span className="cifra block text-[11px] text-muted">{formatearVariacion(r.variacion_30d)} 30d</span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Detalle */}
        <div className="panel p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold">{meta?.nombre ?? '…'}</h2>
              <p className="text-sm text-muted">
                {meta?.descripcion}
                {meta?.unidad && ` · ${meta.unidad}`}
              </p>
            </div>
            <div role="group" aria-label="Período" className="flex flex-wrap border border-border p-0.5">
              {RANGOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => elegirRango(r.id)}
                  aria-pressed={rango === r.id}
                  className={`h-8 px-3 font-mono text-xs transition-colors ${
                    rango === r.id ? 'bg-accent text-on-accent' : 'text-muted hover:text-text'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {rango === 'custom' && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="etiqueta mb-1 block">Desde</span>
                <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className={CAMPO_FECHA} />
              </label>
              <label className="text-sm">
                <span className="etiqueta mb-1 block">Hasta</span>
                <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className={CAMPO_FECHA} />
              </label>
            </div>
          )}

          {serie?.aviso && <p className="mt-4 border border-dashed border-border px-3 py-2 text-sm text-muted">{serie.aviso}</p>}

          {errorSerie ? (
            <p className="mt-6 text-neg">{errorSerie}</p>
          ) : !serie ? (
            <div className="mt-6 grid h-80 place-items-center text-muted">Cargando serie…</div>
          ) : (
            <>
              {estadisticas && (
                <dl className="mt-6 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                  {estadisticas.map(([titulo, valor]) => (
                    <div key={titulo} className="bg-surface px-4 py-3">
                      <dt className="etiqueta">{titulo}</dt>
                      <dd className="cifra mt-1 text-lg font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-6">
                <GraficoSerie datos={datosFiltrados} unidad={meta?.unidad} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Últimos valores */}
      {serie && datosFiltrados.length > 0 && (
        <section className="border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold">Últimos valores</h2>
              <p className="cifra text-[12px] text-muted">
                {datosFiltrados.length.toLocaleString('es-AR')} registros entre {formatearFecha(datosFiltrados[0].fecha)} y{' '}
                {formatearFecha(datosFiltrados.at(-1).fecha)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => descargarCSV(seleccion, datosFiltrados)}
              className="min-h-10 shrink-0 border border-border px-4 font-display text-sm font-semibold hover:bg-surface-2"
            >
              Descargar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="etiqueta px-4 py-2 font-normal sm:px-6">Fecha</th>
                  <th className="etiqueta px-4 py-2 text-right font-normal sm:px-6">Valor</th>
                  <th className="etiqueta px-4 py-2 text-right font-normal sm:px-6">Var. diaria</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.slice(-11).map((p, i, arr) => {
                  if (i === 0) return null
                  const variacion = arr[i - 1].valor ? (p.valor / arr[i - 1].valor - 1) * 100 : null
                  return { ...p, variacion }
                }).filter(Boolean).reverse().map((p) => (
                  <tr key={p.fecha} className="border-t border-border">
                    <td className="px-4 py-2.5 sm:px-6">{formatearFecha(p.fecha, { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                    <td className="cifra px-4 py-2.5 text-right font-medium sm:px-6">{formatearValor(p.valor)}</td>
                    <td className="cifra px-4 py-2.5 text-right text-muted sm:px-6">{formatearVariacion(p.variacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
