/**
 * Sección de indicadores: tarjetas de resumen + detalle de la serie elegida
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import TarjetaIndicador from '@/components/TarjetaIndicador'
import GraficoSerie from '@/components/GraficoSerie'
import Variacion from '@/components/Variacion'
import { obtenerSerie } from '@/services/api'
import { COLORES, formatearFecha, formatearValor, parsearFecha } from '@/lib/formato'

const RANGOS = [
  { id: '1m', label: '1M', dias: 30 },
  { id: '3m', label: '3M', dias: 91 },
  { id: '6m', label: '6M', dias: 182 },
  { id: '1a', label: '1A', dias: 365 },
  { id: '5a', label: '5A', dias: 1826 },
  { id: 'max', label: 'Máx', dias: null },
  { id: 'custom', label: 'Personalizado', dias: null },
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

function Estadistica({ titulo, children }) {
  return (
    <div className="rounded-lg bg-surface-2 px-4 py-3">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{titulo}</p>
      <div className="mt-1 text-lg font-semibold">{children}</div>
    </div>
  )
}

export default function PanelIndicadores({ resumen, errorResumen }) {
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
  const color = COLORES[seleccion]

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
    const primero = valores[0]
    const ultimo = valores.at(-1)
    return {
      ultimo,
      minimo: Math.min(...valores),
      maximo: Math.max(...valores),
      variacion: primero ? ((ultimo / primero - 1) * 100) : null,
    }
  }, [datosFiltrados])

  function elegirRango(id) {
    if (id === 'custom' && serie && !desde && !hasta && datosFiltrados.length) {
      setDesde(datosFiltrados[0].fecha)
      setHasta(datosFiltrados.at(-1).fecha)
    }
    setRango(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Indicadores del BCRA</h2>
          <p className="mt-2 text-muted">
            Series oficiales actualizadas cada día. Elegí un indicador para ver su evolución.
          </p>
        </div>
        {resumen?.length > 0 && (
          <p className="text-sm text-muted">
            Actualizado el {formatearFecha(resumen.map((i) => i.ultima_fecha).filter(Boolean).sort().at(-1))}
          </p>
        )}
      </div>

      {/* Resumen */}
      {errorResumen ? (
        <div className="rounded-xl border border-neg/40 bg-neg-soft p-5 text-neg">
          <p className="font-medium">No se pudo conectar con la API.</p>
          <p className="mt-1 text-sm">
            Verificá que el backend esté corriendo: <code className="font-mono">uvicorn app:app --reload</code> en la carpeta{' '}
            <code className="font-mono">backend</code>. ({errorResumen})
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {resumen
            ? resumen.map((ind) => (
                <TarjetaIndicador
                  key={ind.id}
                  indicador={ind}
                  seleccionada={ind.id === seleccion}
                  onSeleccionar={() => setSeleccion(ind.id)}
                />
              ))
            : Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-44 rounded-xl border border-border bg-surface animate-pulse" />
              ))}
        </section>
      )}

      {/* Detalle */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <h2 className="text-xl font-semibold tracking-tight">{meta?.nombre ?? '…'}</h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              {meta?.descripcion}
              {meta?.unidad && ` · ${meta.unidad}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1 self-start lg:self-auto">
            {RANGOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => elegirRango(r.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  rango === r.id ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
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
              <span className="block text-muted mb-1">Desde</span>
              <input
                type="date"
                value={desde}
                max={hasta || undefined}
                onChange={(e) => setDesde(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5"
              />
            </label>
            <label className="text-sm">
              <span className="block text-muted mb-1">Hasta</span>
              <input
                type="date"
                value={hasta}
                min={desde || undefined}
                onChange={(e) => setHasta(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5"
              />
            </label>
          </div>
        )}

        {serie?.aviso && (
          <p className="mt-4 rounded-md bg-surface-2 px-3 py-2 text-sm text-muted">{serie.aviso}</p>
        )}

        {errorSerie ? (
          <p className="mt-6 text-neg">{errorSerie}</p>
        ) : !serie ? (
          <div className="mt-6 h-80 sm:h-96 grid place-items-center text-muted">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" />
              Cargando serie…
            </div>
          </div>
        ) : (
          <>
            {estadisticas && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Estadistica titulo="Último">{formatearValor(estadisticas.ultimo)}</Estadistica>
                <Estadistica titulo="Mínimo">{formatearValor(estadisticas.minimo)}</Estadistica>
                <Estadistica titulo="Máximo">{formatearValor(estadisticas.maximo)}</Estadistica>
                <Estadistica titulo="Var. del período">
                  <Variacion valor={estadisticas.variacion} />
                </Estadistica>
              </div>
            )}

            <div className="mt-6">
              <GraficoSerie datos={datosFiltrados} color={color} unidad={meta?.unidad} />
            </div>
          </>
        )}
      </section>

      {/* Últimos valores */}
      {serie && datosFiltrados.length > 0 && (
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold">Últimos valores</h2>
              <p className="text-sm text-muted">
                {datosFiltrados.length.toLocaleString('es-AR')} registros entre{' '}
                {formatearFecha(datosFiltrados[0].fecha)} y {formatearFecha(datosFiltrados.at(-1).fecha)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => descargarCSV(seleccion, datosFiltrados)}
              className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
            >
              Descargar CSV
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="px-4 sm:px-6 py-2 font-medium">Fecha</th>
                <th className="px-4 sm:px-6 py-2 font-medium text-right">Valor</th>
                <th className="px-4 sm:px-6 py-2 font-medium text-right">Var. diaria</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.slice(-11).map((p, i, arr) => {
                if (i === 0) return null
                const variacion = arr[i - 1].valor ? (p.valor / arr[i - 1].valor - 1) * 100 : null
                return { ...p, variacion }
              }).filter(Boolean).reverse().map((p) => (
                <tr key={p.fecha} className="border-t border-border">
                  <td className="px-4 sm:px-6 py-2.5">{formatearFecha(p.fecha, { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                  <td className="px-4 sm:px-6 py-2.5 text-right font-medium">{formatearValor(p.valor)}</td>
                  <td className="px-4 sm:px-6 py-2.5 text-right text-xs">
                    <Variacion valor={p.variacion} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
