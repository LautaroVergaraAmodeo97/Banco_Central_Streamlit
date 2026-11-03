/**
 * Estadísticas del INDEC: series clave, comercio exterior y explorador del catálogo
 */

import PanelSeriesIndec from '@/components/indec/PanelSeriesIndec'
import ComercioExterior from '@/components/indec/ComercioExterior'
import ExploradorIndec from '@/components/indec/ExploradorIndec'

export const metadata = {
  title: 'Estadísticas del INDEC · Prognosis',
  description: 'Inflación, actividad, salarios, canastas, pobreza, empleo, comercio exterior y población según el INDEC',
}

export default function PaginaIndec() {
  return (
    <>
      <section className="contenedor py-12">
        <p className="etiqueta">Instituto Nacional de Estadística y Censos</p>
        <h1 className="mt-2 text-4xl font-semibold">Estadísticas del INDEC</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Series clave del Catálogo API-INDEC: precios, ingresos, pobreza, empleo, actividad y población.
        </p>
        <div className="mt-8">
          <PanelSeriesIndec />
        </div>
      </section>

      <section aria-label="Comercio exterior" className="border-y border-border bg-surface">
        <div className="contenedor py-12">
          <ComercioExterior />
        </div>
      </section>

      <section aria-label="Explorador de datos" className="contenedor py-12">
        <ExploradorIndec />
        <p className="mt-8 text-xs text-muted">
          Fuente: Instituto Nacional de Estadística y Censos (INDEC),{' '}
          <a href="https://api.indec.gob.ar/docs" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            Catálogo API-INDEC
          </a>
          . Los datos marcados como provisorios pueden ser revisados en publicaciones posteriores.
        </p>
      </section>
    </>
  )
}
