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

/** Envía el formulario de contacto */
export function enviarContacto(formulario) {
  return apiRequest('/api/contacto/enviar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formulario),
  })
}
