/**
 * Resúmenes compartidos entre la cinta, el inicio y las secciones.
 * Cada uno se pide una sola vez por carga de página, aunque lo usen varios componentes.
 */

'use client'

import { useEffect, useState } from 'react'
import { obtenerResumen, obtenerSeriesIndec } from '@/services/api'

const promesas = {}

function useUnaVez(clave, pedir) {
  const [estado, setEstado] = useState({ datos: null, error: null })
  useEffect(() => {
    let vigente = true
    promesas[clave] ??= pedir().catch((e) => {
      delete promesas[clave] // que el próximo intento vuelva a pedirlo
      throw e
    })
    promesas[clave]
      .then((datos) => vigente && setEstado({ datos, error: null }))
      .catch((e) => vigente && setEstado({ datos: null, error: e.message }))
    return () => { vigente = false }
  }, [clave, pedir])
  return estado
}

/** Último valor, variaciones y sparkline de los indicadores del BCRA */
export function useResumenBCRA() {
  return useUnaVez('bcra', obtenerResumen)
}

/** Resumen de las series clave del INDEC */
export function useResumenIndec() {
  return useUnaVez('indec', obtenerSeriesIndec)
}
