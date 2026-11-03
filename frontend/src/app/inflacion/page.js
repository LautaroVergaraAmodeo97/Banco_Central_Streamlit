/**
 * Calculadora de inflación acumulada
 */

import CalculadoraInflacion from '@/components/CalculadoraInflacion'

export const metadata = {
  title: 'Calculadora de inflación · Prognosis',
  description: 'Actualizá cualquier monto por inflación entre dos meses desde enero de 1992',
}

export default function PaginaInflacion() {
  return (
    <section className="contenedor py-12">
      <p className="etiqueta">Herramienta</p>
      <h1 className="mt-2 text-4xl font-semibold">Calculadora de inflación acumulada</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Convertí precios entre cualquier mes desde enero de 1992. Escribí un monto en cualquiera de los dos campos y te
        mostramos su equivalente ajustado por inflación.
      </p>
      <div className="mt-10">
        <CalculadoraInflacion />
      </div>
    </section>
  )
}
