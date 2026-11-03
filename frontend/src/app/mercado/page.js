/**
 * Mercado: series monetarias y cambiarias del BCRA
 */

import PanelIndicadores from '@/components/PanelIndicadores'

export const metadata = {
  title: 'Mercado · Prognosis',
  description: 'Dólar, reservas, tasas, base monetaria y tipo de cambio real según el BCRA',
}

export default function PaginaMercado() {
  return (
    <section className="contenedor py-12">
      <p className="etiqueta">Banco Central de la República Argentina</p>
      <h1 className="mt-2 text-4xl font-semibold">Mercado</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Las series monetarias y cambiarias del BCRA, unificadas con históricos desde 1996 y actualizadas cada día hábil.
      </p>
      <div className="mt-10">
        <PanelIndicadores />
      </div>
    </section>
  )
}
