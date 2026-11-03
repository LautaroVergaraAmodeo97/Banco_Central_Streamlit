/**
 * Comercio exterior: exportaciones, importaciones y saldo de un año
 */

'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { obtenerComercioExterior } from '@/services/api'
import { formatearFecha, formatearMillonesUSD } from '@/lib/formato'

const ANIO_ACTUAL = new Date().getFullYear()
const ANIOS = Array.from({ length: ANIO_ACTUAL - 1986 + 1 }, (_, i) => ANIO_ACTUAL - i)
const TICKS = { fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }

function Ranking({ titulo, items }) {
  const maximo = Math.max(...items.map((i) => i.valor), 1)
  return (
    <div className="min-w-0">
      <h3 className="etiqueta">{titulo}</h3>
      <ol className="mt-3 space-y-2.5">
        {items.slice(0, 8).map((item) => (
          <li key={item.codigo} className="text-sm">
            <div className="flex justify-between gap-3">
              <span className="truncate capitalize">{item.nombre.toLowerCase()}</span>
              <span className="cifra shrink-0">{formatearMillonesUSD(item.valor)}</span>
            </div>
            <div className="mt-1 h-[3px] bg-surface-2">
              <div className="linea-senal h-full" style={{ width: `${(item.valor / maximo) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function ComercioExterior() {
  // Por defecto, el último año completo
  const [anio, setAnio] = useState(ANIO_ACTUAL - 1)
  const [datos, setDatos] = useState({})
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (datos[anio] || errores[anio]) return
    obtenerComercioExterior(anio)
      .then((d) => setDatos((prev) => ({ ...prev, [anio]: d })))
      .catch((e) => setErrores((prev) => ({ ...prev, [anio]: e.message })))
  }, [anio, datos, errores])

  const actual = datos[anio]
  const saldo = actual ? actual.exportaciones - actual.importaciones : 0
  const meses = actual?.por_mes.map((m) => ({ ...m, mes: formatearFecha(m.fecha, { month: 'short' }) })) ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta">Comercio exterior de bienes</p>
          <h2 className="mt-2 text-3xl font-semibold">Lo que Argentina vende y compra al mundo</h2>
        </div>
        <label className="text-sm">
          <span className="etiqueta mb-1 block">Año</span>
          <select id="anio-comercio" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="cifra h-10 border border-border bg-surface px-3">
            {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>

      {errores[anio] ? (
        <p className="mt-6 text-neg">{errores[anio]}</p>
      ) : !actual ? (
        <div className="mt-6 grid h-80 place-items-center text-center text-muted">
          Sumando el detalle por país y rubro… la primera vez puede tardar unos segundos.
        </div>
      ) : (
        <>
          <dl className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
            {[
              ['Exportaciones (FOB)', formatearMillonesUSD(actual.exportaciones)],
              ['Importaciones (CIF)', formatearMillonesUSD(actual.importaciones)],
              [saldo >= 0 ? 'Superávit' : 'Déficit', formatearMillonesUSD(Math.abs(saldo))],
            ].map(([titulo, valor]) => (
              <div key={titulo} className="bg-surface px-5 py-4">
                <dt className="etiqueta">{titulo}</dt>
                <dd className="cifra mt-1 text-2xl font-medium">{valor}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meses} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke="var(--grid)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="mes" tick={TICKS} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1e9).toLocaleString('es-AR', { maximumFractionDigits: 1 })} mil M`}
                  tick={TICKS}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  formatter={(v, nombre) => [formatearMillonesUSD(v), nombre]}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  labelStyle={{ color: 'var(--muted)' }}
                  cursor={{ fill: 'var(--surface-2)' }}
                />
                <Bar dataKey="exportaciones" name="Exportaciones" fill="var(--signal)" />
                <Bar dataKey="importaciones" name="Importaciones" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 flex flex-wrap gap-5 text-sm">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-signal" />Exportaciones</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-accent" />Importaciones</span>
            <span className="etiqueta self-center">US$ por mes</span>
          </p>

          <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <Ranking titulo="Destinos de exportación" items={actual.destinos} />
            <Ranking titulo="Orígenes de importación" items={actual.origenes} />
            <Ranking titulo="Exportación por rubro" items={actual.exportaciones_por_rubro} />
            <Ranking titulo="Importación por uso económico" items={actual.importaciones_por_uso} />
          </div>
        </>
      )}
    </div>
  )
}
