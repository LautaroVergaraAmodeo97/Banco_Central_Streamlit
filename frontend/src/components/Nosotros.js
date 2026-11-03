/**
 * Sección "Quiénes somos" de la página principal
 */

import Link from 'next/link'

// Es un proceso real y en orden: por eso va numerado
const PASOS = [
  { titulo: 'Recolectamos', texto: 'Consultamos las APIs públicas del BCRA y del INDEC, y las complementamos con series históricas desde 1996.' },
  { titulo: 'Procesamos', texto: 'Limpiamos, unificamos y validamos cada serie antes de publicarla.' },
  { titulo: 'Interpretamos', texto: 'Convertimos los datos en lecturas concretas para tu rubro: precios, costos, financiamiento.' },
]

export default function Nosotros() {
  return (
    <section id="nosotros" className="contenedor scroll-mt-40 py-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="etiqueta">Quiénes somos</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight">Una consultora abierta a lo que tu empresa necesite.</h2>
          <p className="mt-5 text-muted">
            Nuestro objetivo es asesorar a nuestros clientes sobre decisiones económicas para su empresa o emprendimiento,
            brindando datos confiables y análisis detallados.
          </p>
          <p className="mt-4 text-muted">
            Trabajamos con las series oficiales del Banco Central y del INDEC, y las ponemos a disposición de forma abierta
            para que cualquiera pueda consultarlas.
          </p>
          <Link href="/contacto" className="mt-7 inline-flex min-h-11 items-center border border-border px-5 font-display font-semibold hover:bg-surface-2">
            Contanos tu caso
          </Link>
        </div>

        <ol className="grid gap-px border border-border bg-border lg:col-span-6 lg:col-start-7">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 bg-bg p-6">
              <span className="cifra text-2xl text-signal">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-lg font-semibold">{p.titulo}</h3>
                <p className="mt-1 text-muted">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
