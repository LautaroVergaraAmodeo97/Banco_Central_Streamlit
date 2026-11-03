/**
 * Lectura del día: diez indicadores del BCRA y del INDEC en una tabla de instrumentos
 */

'use client'

import Mini from '@/components/Mini'
import { formatearConUnidad, formatearFecha, formatearValor, formatearVariacion } from '@/lib/formato'
import { formatearPeriodo } from '@/lib/periodos'

const BCRA = ['tipo-cambio-mayorista', 'tipo-cambio-minorista', 'reservas', 'baibar']
const INDEC = ['ipc-mensual', 'ipc-interanual', 'emae-interanual', 'salarios-interanual', 'desocupacion', 'pobreza-personas']

export default function LecturaDelDia({ bcra, indec }) {
  const lecturas = [
    ...BCRA.map((id) => bcra?.find((r) => r.id === id)).filter((r) => r && !r.error).map((r) => ({
      id: r.id,
      nombre: r.nombre,
      fuente: 'BCRA',
      valor: formatearValor(r.ultimo_valor),
      detalle: `${formatearVariacion(r.variacion_30d)} en 30 días`,
      cuando: formatearFecha(r.ultima_fecha),
      serie: r.sparkline?.map((p) => p.valor),
    })),
    ...INDEC.map((id) => indec?.find((s) => s.id === id)).filter((s) => s && !s.error).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      fuente: 'INDEC',
      valor: formatearConUnidad(s.ultimo_valor, s.unidad),
      detalle: s.descripcion,
      cuando: formatearPeriodo(s.ultima_fecha, s.frecuencia),
      serie: s.sparkline?.map((p) => p.valor),
    })),
  ]
  const ultima = bcra?.map((r) => r.ultima_fecha).filter(Boolean).sort().at(-1)

  return (
    <section className="contenedor py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta">Lectura del día</p>
          <h2 className="mt-2 text-3xl font-semibold">Diez indicadores que mueven tus números</h2>
        </div>
        {ultima && <p className="cifra text-sm text-muted">Datos al {formatearFecha(ultima)}</p>}
      </div>

      {lecturas.length === 0 ? (
        <div className="mt-8 grid gap-px border border-border bg-border lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[4.5rem] animate-pulse bg-surface" />)}
        </div>
      ) : (
        <ul className="mt-8 grid border-t border-border lg:grid-cols-2 lg:gap-x-10">
          {lecturas.map((l) => (
            <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {l.nombre}
                  <span className="border border-border px-1.5 py-px font-mono text-[10px] tracking-widest text-muted">{l.fuente}</span>
                </p>
                <p className="truncate text-[13px] text-muted">{l.detalle}</p>
              </div>
              <Mini valores={l.serie} className="hidden h-8 w-28 sm:block" />
              <div className="text-right">
                <p className="cifra text-lg font-medium">{l.valor}</p>
                <p className="cifra text-[11px] text-muted">{l.cuando}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
