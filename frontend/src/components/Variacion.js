/**
 * Insignia de variación porcentual (verde si sube, rojo si baja)
 */

import { formatearVariacion } from '@/lib/formato'

export default function Variacion({ valor, sufijo }) {
  if (valor === null || valor === undefined) {
    return <span className="text-muted">—</span>
  }
  // Por debajo de 0,05% el valor se muestra redondeado a 0,0%: se trata como sin cambios
  const signo = Math.abs(valor) < 0.05 ? 0 : Math.sign(valor)
  const estilo = signo > 0 ? 'bg-pos-soft text-pos' : signo < 0 ? 'bg-neg-soft text-neg' : 'bg-surface-2 text-muted'
  const flecha = signo > 0 ? '▲' : signo < 0 ? '▼' : '■'

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium whitespace-nowrap ${estilo}`}>
      <span className="text-[0.6rem]">{flecha}</span>
      {formatearVariacion(valor)}
      {sufijo && <span className="opacity-70">{sufijo}</span>}
    </span>
  )
}
