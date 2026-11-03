/**
 * Explorador de las 19 tablas del Catálogo API-INDEC: filtros, tabla, gráfico y CSV
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import GraficoSerie from '@/components/GraficoSerie'
import { consultarTablaIndec, obtenerCatalogoIndec, obtenerDimensionesIndec } from '@/services/api'
import { fechaDePeriodo } from '@/lib/periodos'

const FILAS_VISIBLES = 100
const CAMPO = 'w-full min-h-10 border border-border bg-surface px-3 text-sm'

function aCSV(filas, columnas) {
  const celda = (v) => {
    const texto = v === null || v === undefined ? '' : String(v)
    return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  return [columnas.join(','), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(','))].join('\n')
}

function descargar(nombre, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

/** Si el resultado es una sola serie (un valor por período), la devuelve lista para graficar */
function serieGraficable(filas, columnaPeriodo) {
  if (!columnaPeriodo || !filas.length || !('valor' in filas[0])) return null
  const porFecha = new Map()
  for (const fila of filas) {
    const fecha = fechaDePeriodo(fila[columnaPeriodo])
    if (!fecha || fila.valor === null) continue
    if (porFecha.has(fecha)) return null
    porFecha.set(fecha, fila.valor)
  }
  if (porFecha.size < 2) return null
  return [...porFecha].sort(([a], [b]) => a.localeCompare(b)).map(([fecha, valor]) => ({ fecha, valor }))
}

export default function ExploradorIndec() {
  const [catalogo, setCatalogo] = useState(null)
  const [tabla, setTabla] = useState('ipc_nacional')
  const [dimensiones, setDimensiones] = useState({})
  const [filtros, setFiltros] = useState({})
  const [resultado, setResultado] = useState(null)
  const [estado, setEstado] = useState('inicial') // inicial | cargando | listo
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenerCatalogoIndec().then(setCatalogo).catch((e) => setError(e.message))
  }, [])

  // Las dimensiones se guardan por tabla para no volver a pedirlas
  useEffect(() => {
    if (dimensiones[tabla]) return
    obtenerDimensionesIndec(tabla)
      .then((d) => setDimensiones((prev) => ({ ...prev, [tabla]: d })))
      .catch(() => setDimensiones((prev) => ({ ...prev, [tabla]: { dimensiones: {} } })))
  }, [tabla, dimensiones])

  const areas = useMemo(() => {
    const porArea = {}
    for (const t of catalogo?.tablas ?? []) (porArea[t.area] ??= []).push(t)
    return Object.entries(porArea)
  }, [catalogo])

  const meta = catalogo?.tablas.find((t) => t.id === tabla)
  const dims = dimensiones[tabla]
  const columnas = useMemo(
    () => (resultado?.filas[0] ? Object.keys(resultado.filas[0]).filter((c) => !c.endsWith('_null')) : []),
    [resultado]
  )
  const serie = useMemo(() => (resultado ? serieGraficable(resultado.filas, dims?.periodo) : null), [resultado, dims])

  const elegirTabla = (id) => {
    setTabla(id)
    setFiltros({})
    setResultado(null)
    setError(null)
    setEstado('inicial')
  }

  const consultar = async () => {
    setEstado('cargando')
    setError(null)
    try {
      const activos = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
      setResultado(await consultarTablaIndec(tabla, activos))
      setEstado('listo')
    } catch (e) {
      setResultado(null)
      setError(e.message)
      setEstado('inicial')
    }
  }

  return (
    <div>
      <p className="etiqueta">Las 19 tablas del catálogo</p>
      <h2 className="mt-2 text-3xl font-semibold">Explorador de datos</h2>
      <p className="mt-3 max-w-2xl text-muted">
        Consultá cualquiera de las {catalogo?.tablas.length ?? 19} tablas del Catálogo API-INDEC, filtrá por categoría y descargá el resultado.
      </p>

      <label className="mt-6 block text-sm">
        <span className="etiqueta mb-1 block">Tabla</span>
        <select value={tabla} onChange={(e) => elegirTabla(e.target.value)} className={CAMPO}>
          {areas.map(([area, tablas]) => (
            <optgroup key={area} label={area}>
              {tablas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      {meta && <p className="mt-2 text-sm text-muted">{meta.descripcion}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!dims ? (
          <p className="text-sm text-muted">Cargando filtros…</p>
        ) : (
          Object.entries(dims.dimensiones).map(([columna, valores]) => (
            <label key={columna} className="text-sm min-w-0">
              <span className="etiqueta mb-1 block">{columna.replace(/_/g, ' ')}</span>
              <select
                value={filtros[columna] ?? ''}
                onChange={(e) => setFiltros((prev) => ({ ...prev, [columna]: e.target.value }))}
                className={CAMPO}
              >
                <option value="">Todos</option>
                {valores.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          ))
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={consultar}
          disabled={estado === 'cargando'}
          className="min-h-11 bg-accent px-6 font-display font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
        >
          {estado === 'cargando' ? 'Consultando…' : 'Consultar'}
        </button>
        {resultado && (
          <button
            type="button"
            onClick={() => descargar(`${tabla}.csv`, aCSV(resultado.filas, columnas))}
            className="min-h-11 border border-border px-4 font-display text-sm font-semibold hover:bg-surface-2"
          >
            Descargar CSV ({resultado.total.toLocaleString('es-AR')} filas)
          </button>
        )}
      </div>

      {error && <p className="mt-4 border border-neg/40 bg-neg-soft px-3 py-2 text-sm text-neg">{error}</p>}

      {resultado && (
        <div className="mt-6 space-y-6">
          {serie && <GraficoSerie datos={serie} unidad={resultado.filas[0].unidad_de_medida ?? ''} mensual />}
          <div>
            <p className="text-sm text-muted">
              {resultado.total.toLocaleString('es-AR')} filas
              {resultado.total > FILAS_VISIBLES && ` · se muestran las primeras ${FILAS_VISIBLES}; el CSV las incluye todas`}
            </p>
            <div className="mt-2 max-h-[28rem] overflow-auto border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-2">
                  <tr>
                    {columnas.map((c) => <th key={c} className="etiqueta px-3 py-2 text-left font-normal whitespace-nowrap">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {resultado.filas.slice(0, FILAS_VISIBLES).map((fila, i) => (
                    <tr key={i} className="border-t border-border">
                      {columnas.map((c) => (
                        <td key={c} className={`px-3 py-1.5 whitespace-nowrap ${typeof fila[c] === 'number' ? 'cifra text-right' : ''}`}>
                          {typeof fila[c] === 'number' ? fila[c].toLocaleString('es-AR', { maximumFractionDigits: 2 }) : fila[c] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
