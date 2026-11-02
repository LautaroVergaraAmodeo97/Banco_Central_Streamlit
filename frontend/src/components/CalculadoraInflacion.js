/**
 * Calculadora de inflación acumulada
 *
 * Convierte un monto entre dos meses usando la inflación mensual (IPC)
 * publicada por el BCRA. Cada mes se toma como su primer día: el precio de
 * "enero" ya incluye la inflación hasta diciembre del año anterior.
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import GraficoSerie from '@/components/GraficoSerie'
import { obtenerSerie } from '@/services/api'
import { MESES, formatearValor } from '@/lib/formato'

// Desde 1992 rige el peso actual: antes los montos estarían en otra moneda
const PRIMER_MES = '1992-01'

const FUENTES = {
  indec: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
  apiBcra: 'https://www.bcra.gob.ar/BCRAyVos/catalogo-de-APIs-banco-central.asp',
  cavallo: 'https://doi.org/10.2139/ssrn.1906704',
}

const PERIODOS = [
  { label: 'Último año', meses: 12 },
  { label: '5 años', meses: 60 },
  { label: '10 años', meses: 120 },
  { label: 'Desde 2001', desde: '2001-12' },
]

function sumarMeses(mes, n) {
  const [a, m] = mes.split('-').map(Number)
  const total = a * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

function mesesEntre(desde, hasta) {
  const [a1, m1] = desde.split('-').map(Number)
  const [a2, m2] = hasta.split('-').map(Number)
  return (a2 - a1) * 12 + (m2 - m1)
}

function nombreMes(mes) {
  const [a, m] = mes.split('-').map(Number)
  return `${MESES[m - 1]} de ${a}`
}

/** Acepta "1.500,75", "1500.75" o "1500" */
function parsearMonto(texto) {
  const limpio = texto.trim().replace(/\$/g, '').replace(/\s/g, '')
  const normalizado = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio
  const n = Number(normalizado)
  return normalizado !== '' && Number.isFinite(n) ? n : null
}

function formatearPorcentaje(v) {
  return `${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

/** Índice de precios al primer día de cada mes, base enero 1992 = 1 */
function construirIndice(datos) {
  const inflacion = Object.fromEntries(datos.map((p) => [p.fecha.slice(0, 7), p.valor]))
  const indice = { [PRIMER_MES]: 1 }
  let mes = PRIMER_MES
  while (inflacion[mes] !== undefined) {
    const siguiente = sumarMeses(mes, 1)
    indice[siguiente] = indice[mes] * (1 + inflacion[mes] / 100)
    mes = siguiente
  }
  return { indice, ultimoMes: mes }
}

function SelectorMes({ id, valor, onCambiar, minimo, maximo }) {
  const [anio, mes] = valor.split('-').map(Number)
  const anioMin = Number(minimo.slice(0, 4))
  const anioMax = Number(maximo.slice(0, 4))
  const anios = Array.from({ length: anioMax - anioMin + 1 }, (_, i) => anioMax - i)

  const elegir = (a, m) => {
    let nuevo = `${a}-${String(m).padStart(2, '0')}`
    if (nuevo < minimo) nuevo = minimo
    if (nuevo > maximo) nuevo = maximo
    onCambiar(nuevo)
  }
  const clase = 'min-h-11 rounded-lg border border-border bg-surface px-3 font-medium focus:outline-none focus:ring-2 focus:ring-accent/40'

  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor={`${id}-mes`}>Mes</label>
      <select id={`${id}-mes`} value={mes} onChange={(e) => elegir(anio, Number(e.target.value))} className={clase}>
        {MESES.map((nombre, i) => (
          <option key={nombre} value={i + 1}>{nombre}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`${id}-anio`}>Año</label>
      <select id={`${id}-anio`} value={anio} onChange={(e) => elegir(Number(e.target.value), mes)} className={clase}>
        {anios.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}

export default function CalculadoraInflacion() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [desde, setDesde] = useState(null)
  const [hasta, setHasta] = useState(null)
  const [texto, setTexto] = useState('100')
  const [campoActivo, setCampoActivo] = useState('desde') // el monto que escribió el usuario

  useEffect(() => {
    obtenerSerie('inflacion-mensual')
      .then((s) => setDatos(s.datos))
      .catch((e) => setError(e.message))
  }, [])

  const calculo = useMemo(() => (datos ? construirIndice(datos) : null), [datos])
  const ultimoMes = calculo?.ultimoMes
  const mesDesde = desde ?? (ultimoMes && sumarMeses(ultimoMes, -12))
  const mesHasta = hasta ?? ultimoMes

  if (error) {
    return <p className="rounded-xl bg-neg-soft p-5 text-neg">No se pudieron cargar los datos de inflación: {error}</p>
  }
  if (!calculo) {
    return <div className="h-96 rounded-2xl border border-border bg-surface animate-pulse" />
  }

  const { indice } = calculo
  const factor = indice[mesHasta] / indice[mesDesde]
  const monto = parsearMonto(texto)
  const montoDesde = campoActivo === 'desde' ? monto : monto !== null ? monto / factor : null
  const montoHasta = campoActivo === 'hasta' ? monto : monto !== null ? monto * factor : null

  // Estadísticas siempre del mes más antiguo al más reciente
  const [anterior, posterior] = mesDesde <= mesHasta ? [mesDesde, mesHasta] : [mesHasta, mesDesde]
  const meses = mesesEntre(anterior, posterior)
  const variacion = indice[posterior] / indice[anterior]
  const promedioMensual = meses ? (variacion ** (1 / meses) - 1) * 100 : 0
  const anualizada = meses ? (variacion ** (12 / meses) - 1) * 100 : 0

  const montoBase = anterior === mesDesde ? montoDesde : montoHasta
  const evolucion = montoBase === null ? [] : Array.from({ length: meses + 1 }, (_, i) => {
    const mes = sumarMeses(anterior, i)
    return { fecha: `${mes}-01`, valor: montoBase * indice[mes] / indice[anterior] }
  })

  const mostrar = (campo, valor) =>
    campoActivo === campo ? texto : valor === null ? '' : formatearValor(valor)
  const escribir = (campo) => (e) => {
    setCampoActivo(campo)
    setTexto(e.target.value)
  }
  const invertir = () => {
    setDesde(mesHasta)
    setHasta(mesDesde)
  }
  const elegirPeriodo = (p) => {
    setHasta(ultimoMes)
    setDesde(p.desde ?? sumarMeses(ultimoMes, -p.meses))
  }
  const claseMonto = 'w-full min-h-12 rounded-lg border border-border bg-surface pl-8 pr-3 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-accent/40'

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => elegirPeriodo(p)}
            className="min-h-9 px-3 rounded-full border border-border text-sm font-medium text-muted hover:text-text hover:bg-surface-2"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted" aria-hidden="true">$</span>
              <label htmlFor="monto-desde" className="sr-only">Monto en el mes de origen</label>
              <input id="monto-desde" inputMode="decimal" value={mostrar('desde', montoDesde)} onChange={escribir('desde')} className={claseMonto} />
            </div>
            <span className="text-sm text-muted">en</span>
            <SelectorMes id="desde" valor={mesDesde} onCambiar={setDesde} minimo={PRIMER_MES} maximo={ultimoMes} />
          </div>

          <div className="my-4 flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-border" />
            equivale aproximadamente a
            <button
              type="button"
              onClick={invertir}
              aria-label="Invertir los meses"
              className="grid place-items-center w-10 h-10 rounded-full border border-border text-text hover:bg-surface-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 4v16M7 4L3 8M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4" />
              </svg>
            </button>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted" aria-hidden="true">$</span>
              <label htmlFor="monto-hasta" className="sr-only">Monto en el mes de destino</label>
              <input id="monto-hasta" inputMode="decimal" value={mostrar('hasta', montoHasta)} onChange={escribir('hasta')} className={claseMonto} />
            </div>
            <span className="text-sm text-muted">en</span>
            <SelectorMes id="hasta" valor={mesHasta} onCambiar={setHasta} minimo={PRIMER_MES} maximo={ultimoMes} />
          </div>

          <div className="mt-6 rounded-xl bg-surface-2 p-5" aria-live="polite">
            {meses === 0 ? (
              <p className="text-muted">Elegí dos meses distintos para ver la inflación acumulada.</p>
            ) : (
              <>
                <p className="text-sm text-muted">
                  Inflación acumulada entre {nombreMes(anterior)} y {nombreMes(posterior)}
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight">{formatearPorcentaje((variacion - 1) * 100)}</p>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted">Promedio mensual</dt>
                    <dd className="mt-0.5 text-lg font-semibold">{formatearPorcentaje(promedioMensual)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Anualizada</dt>
                    <dd className="mt-0.5 text-lg font-semibold">{formatearPorcentaje(anualizada)}</dd>
                  </div>
                </dl>
                {anterior < '2016-01' && posterior > '2007-01' && (
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    El período incluye meses de 2007 a 2015, cuando el IPC oficial fue cuestionado: la inflación real
                    pudo ser mayor. Ver las fuentes más abajo.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium">
            {montoBase !== null && meses > 0
              ? `Cuánto se necesita para comprar lo mismo que $${formatearValor(montoBase)} en ${nombreMes(anterior)}`
              : 'Evolución del monto ajustado por inflación'}
          </p>
          <div className="mt-3">
            <GraficoSerie datos={meses > 0 ? evolucion : []} color="#3b6fe0" unidad="ARS" mensual />
          </div>
        </div>
      </div>

      <section aria-labelledby="fuentes-inflacion" className="mt-8 border-t border-border pt-6 text-sm leading-relaxed text-muted">
        <h3 id="fuentes-inflacion" className="font-semibold text-text">Fuentes</h3>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>
            <span className="text-text">Índice de Precios al Consumidor (IPC)</span> del{' '}
            <a href={FUENTES.indec} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">INDEC</a>,
            variación mensual. Se obtiene de la serie “Inflación mensual” de la{' '}
            <a href={FUENTES.apiBcra} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">API de Estadísticas del BCRA</a>{' '}
            (último dato: {nombreMes(sumarMeses(ultimoMes, -1))}).
          </li>
          <li>
            Entre 2007 y 2015 las cifras oficiales del IPC fueron cuestionadas y suelen mostrar una inflación menor a la de
            mediciones alternativas. Para ese período, ver Cavallo, A. (2012), <cite>Online and official price indexes:
            Measuring Argentina’s inflation</cite>, MIT Sloan Research Paper No. 4975-12,{' '}
            <a href={FUENTES.cavallo} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">doi:10.2139/ssrn.1906704</a>.
          </li>
        </ul>
        <p className="mt-3 text-xs">
          Cada mes se interpreta como su primer día: “enero de 1992” equivale al 1 de enero de 1992. El cálculo arranca en
          enero de 1992, cuando se introdujo el peso actual. Puede haber diferencias menores por redondeo, ya que la
          inflación mensual se publica con un decimal.
        </p>
      </section>
    </div>
  )
}
