/**
 * Utilidades de formato (es-AR) y colores por indicador
 */

export const COLORES = {
  reservas: '#2a9d6f',
  'tipo-cambio-minorista': '#3b6fe0',
  'tipo-cambio-mayorista': '#7b5cd6',
  baibar: '#d9822b',
  'base-monetaria': '#1f9bb5',
  itcrm: '#d0507a',
}

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Parsea 'AAAA-MM-DD' como fecha local (evita el corrimiento por zona horaria) */
export function parsearFecha(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function formatearFecha(iso, opciones = { day: '2-digit', month: 'short', year: 'numeric' }) {
  return parsearFecha(iso).toLocaleDateString('es-AR', opciones)
}

export function formatearValor(valor, decimales = 2) {
  if (valor === null || valor === undefined) return '—'
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: Math.abs(valor) >= 100000 ? 0 : decimales,
    maximumFractionDigits: Math.abs(valor) >= 100000 ? 0 : decimales,
  })
}

/** Formato para ejes: compacto solo en valores grandes, para no repetir etiquetas */
export function formatearCompacto(valor) {
  if (Math.abs(valor) >= 100000) {
    return valor.toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })
  }
  return valor.toLocaleString('es-AR', { maximumFractionDigits: Math.abs(valor) >= 100 ? 0 : 2 })
}

export function formatearVariacion(v) {
  if (v === null || v === undefined) return '—'
  if (Math.abs(v) < 0.05) v = 0
  const signo = v > 0 ? '+' : ''
  return `${signo}${v.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/** Toma como máximo `max` puntos repartidos en la serie, conservando el último */
export function reducirPuntos(datos, max = 1200) {
  if (datos.length <= max) return datos
  const paso = Math.ceil(datos.length / max)
  const reducidos = datos.filter((_, i) => i % paso === 0)
  if (reducidos[reducidos.length - 1] !== datos[datos.length - 1]) {
    reducidos.push(datos[datos.length - 1])
  }
  return reducidos
}
