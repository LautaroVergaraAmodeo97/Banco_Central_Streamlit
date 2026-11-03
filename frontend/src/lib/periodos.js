/**
 * Formato de fechas según la frecuencia de cada serie del INDEC
 */

import { formatearFecha, parsearFecha } from '@/lib/formato'

export function formatearPeriodo(iso, frecuencia = 'mensual') {
  const fecha = parsearFecha(iso)
  const anio = fecha.getFullYear()
  const mes = fecha.getMonth() + 1
  if (frecuencia === 'anual') return String(anio)
  if (frecuencia === 'semestral') return `${mes <= 6 ? '1°' : '2°'} sem. ${anio}`
  if (frecuencia === 'trimestral') return `${Math.ceil(mes / 3)}° trim. ${anio}`
  return formatearFecha(iso, { month: 'short', year: 'numeric' })
}

/** '202609' → '2026-09-01', '20261S' → '2026-01-01', '20262T' → '2026-04-01', '2026' → '2026-07-01' */
export function fechaDePeriodo(periodo) {
  const s = String(periodo ?? '').trim()
  if (/^\d{6}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4)}-01`
  const parcial = s.match(/^(\d{4})(\d)([ST])$/)
  if (parcial) {
    const n = Number(parcial[2])
    const mes = parcial[3] === 'S' ? (n === 1 ? 1 : 7) : 3 * n - 2
    return `${parcial[1]}-${String(mes).padStart(2, '0')}-01`
  }
  if (/^\d{4}$/.test(s)) return `${s}-07-01`
  return null
}

/** Cambio respecto del período anterior: en puntos si la serie ya es un porcentaje */
export function describirCambio(actual, anterior, unidad) {
  if (actual === null || anterior === null || anterior === undefined || anterior === 0) return null
  if (unidad === '%') {
    const diferencia = actual - anterior
    return { valor: diferencia, texto: `${diferencia > 0 ? '+' : ''}${diferencia.toLocaleString('es-AR', { maximumFractionDigits: 1 })} p.p.` }
  }
  const variacion = (actual / anterior - 1) * 100
  return { valor: variacion, texto: `${variacion > 0 ? '+' : ''}${variacion.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%` }
}
