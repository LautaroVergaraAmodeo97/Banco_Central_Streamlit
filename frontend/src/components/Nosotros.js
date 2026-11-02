/**
 * Sección "Quiénes somos" (antes era una página aparte)
 */

const PILARES = [
  {
    titulo: 'Datos oficiales',
    texto: 'Series del BCRA desde 1996, unificadas y actualizadas a diario.',
    icono: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  },
  {
    titulo: 'Análisis a medida',
    texto: 'Asesoramos según el rubro y las necesidades de cada cliente.',
    icono: 'M12 3a9 9 0 1 0 9 9h-9z M14 3.5A9 9 0 0 1 20.5 10H14z',
  },
  {
    titulo: 'Acceso abierto',
    texto: 'Gráficos interactivos, filtros por período y descarga en CSV.',
    icono: 'M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  },
  {
    titulo: 'Para empresas y emprendedores',
    texto: 'Información clara para planificar precios, costos e inversiones.',
    icono: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  },
]

const PASOS = [
  { titulo: 'Recolectamos', texto: 'Consultamos la API pública del BCRA y la complementamos con series históricas.' },
  { titulo: 'Procesamos', texto: 'Limpiamos, unificamos y validamos cada serie antes de publicarla.' },
  { titulo: 'Visualizamos', texto: 'Presentamos los datos en gráficos claros, listos para tomar decisiones.' },
]

export default function Nosotros() {
  return (
    <section id="nosotros" className="scroll-mt-40 sm:scroll-mt-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Quiénes somos</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight">
            Una consultora abierta a lo que tu empresa necesite.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Nuestro objetivo es asesorar a nuestros clientes sobre decisiones económicas para su empresa o
            emprendimiento, brindando datos confiables y análisis detallados.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Trabajamos con las series oficiales del Banco Central de la República Argentina y las ponemos a
            disposición de forma abierta, para que cualquiera pueda consultarlas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 content-start">
          {PILARES.map((p) => (
            <div key={p.titulo} className="rounded-xl border border-border bg-surface p-5">
              <span className="grid place-items-center w-10 h-10 rounded-lg bg-accent-soft text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={p.icono} />
                </svg>
              </span>
              <h3 className="mt-4 font-semibold">{p.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="text-xl font-semibold">Cómo trabajamos los datos</h3>
        <ol className="mt-6 grid gap-8 md:grid-cols-3">
          {PASOS.map((s, i) => (
            <li key={s.titulo} className="flex gap-4">
              <span className="grid place-items-center shrink-0 w-9 h-9 rounded-full border border-accent/40 text-accent font-bold">
                {i + 1}
              </span>
              <div>
                <h4 className="mt-1.5 font-semibold">{s.titulo}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
