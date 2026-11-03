/**
 * Cinta de cotizaciones: los indicadores del BCRA y del INDEC en una línea que se desplaza
 */

'use client'

import { useResumenBCRA, useResumenIndec } from '@/lib/datos'
import { formatearConUnidad, formatearValor, formatearVariacion } from '@/lib/formato'

const INDEC_EN_CINTA = ['ipc-mensual', 'ipc-interanual', 'emae-interanual', 'salarios-interanual', 'desocupacion', 'pobreza-personas']

export default function Cinta() {
  const { datos: bcra } = useResumenBCRA()
  const { datos: indec } = useResumenIndec()

  const items = [
    ...(bcra ?? []).filter((r) => !r.error).map((r) => ({
      nombre: r.nombre,
      valor: formatearValor(r.ultimo_valor),
      nota: `${formatearVariacion(r.variacion_30d)} 30d`,
    })),
    ...(indec ?? []).filter((s) => !s.error && INDEC_EN_CINTA.includes(s.id)).map((s) => ({
      nombre: s.nombre,
      valor: formatearConUnidad(s.ultimo_valor, s.unidad),
      nota: 'INDEC',
    })),
  ]
  if (!items.length) return null

  // La lista va dos veces para que el desplazamiento no tenga cortes
  const fila = (oculta) => (
    <ul className="flex shrink-0" aria-hidden={oculta || undefined}>
      {items.map((i) => (
        <li key={i.nombre} className="flex items-baseline gap-2 border-r border-border px-5 py-1.5 text-[12.5px]">
          <span className="whitespace-nowrap text-muted">{i.nombre}</span>
          <span className="cifra whitespace-nowrap font-medium">{i.valor}</span>
          <span className="cifra whitespace-nowrap text-[11px] text-signal">{i.nota}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="overflow-hidden border-t border-border" aria-label="Últimos valores de los indicadores">
      <div className="cinta flex w-max">
        {fila(false)}
        {fila(true)}
      </div>
    </div>
  )
}
