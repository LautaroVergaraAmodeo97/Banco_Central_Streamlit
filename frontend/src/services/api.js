/**
 * Servicio API - Conexión con el backend FastAPI
 *
 * Por defecto las llamadas van a /api del mismo origen y Next.js las
 * reenvía al backend (ver rewrites en next.config.mjs).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function apiRequest(endpoint, opciones = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, opciones)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    // FastAPI devuelve una lista de errores cuando falla la validación (422)
    const detalle = typeof data.detail === 'string' ? data.detail : null
    throw new Error(
      detalle || (response.status === 422 ? 'Revisá los datos ingresados.' : `Error ${response.status} al consultar el servidor`)
    )
  }
  return data
}

/** Último valor, variaciones y sparkline de todos los indicadores */
export function obtenerResumen() {
  return apiRequest('/api/resumen')
}

/** Serie completa de un indicador (id: 'reservas', 'itcrm', ...) */
export function obtenerSerie(id, fechaInicio = null, fechaFin = null) {
  const params = new URLSearchParams()
  if (fechaInicio) params.set('fecha_inicio', fechaInicio)
  if (fechaFin) params.set('fecha_fin', fechaFin)
  const query = params.toString()
  return apiRequest(`/api/${id}${query ? `?${query}` : ''}`)
}

// ==================== INDEC ====================

/** Resumen de las series clave del INDEC */
export function obtenerSeriesIndec() {
  return apiRequest('/api/indec/series')
}

/** Serie completa de un indicador clave del INDEC (id: 'ipc-mensual', 'emae', ...) */
export function obtenerSerieIndec(id) {
  return apiRequest(`/api/indec/series/${encodeURIComponent(id)}`)
}

/** Exportaciones e importaciones de un año */
export function obtenerComercioExterior(anio) {
  return apiRequest(`/api/indec/comercio/${encodeURIComponent(anio)}`)
}

/** Las 19 tablas del Catálogo API-INDEC */
export function obtenerCatalogoIndec() {
  return apiRequest('/api/indec')
}

/** Valores posibles de las columnas de categorías de una tabla */
export function obtenerDimensionesIndec(tabla) {
  return apiRequest(`/api/indec/${encodeURIComponent(tabla)}/dimensiones`)
}

/** Filas de una tabla del INDEC filtradas por columna ({ region: 'GBA', ... }) */
export function consultarTablaIndec(tabla, filtros = {}) {
  const query = new URLSearchParams(filtros).toString()
  return apiRequest(`/api/indec/${encodeURIComponent(tabla)}${query ? `?${query}` : ''}`)
}

/** Envía el formulario de contacto */
export function enviarContacto(formulario) {
  return apiRequest('/api/contacto/enviar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formulario),
  })
}
