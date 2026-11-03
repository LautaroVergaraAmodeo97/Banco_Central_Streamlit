/**
 * Sección "Quién soy": el autor detrás de Prognosis
 */

import { PERFIL } from '@/lib/perfil'

export default function QuienSoy() {
  const iniciales = PERFIL.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('')

  return (
    <section id="quien-soy" className="border-t border-border bg-surface scroll-mt-40">
      <div className="contenedor grid gap-10 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="etiqueta">Quién soy</p>
          <div className="panel mt-4 flex items-center gap-5 p-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center bg-marca-fondo font-marca text-xl font-bold" aria-hidden="true">
              <span className="texto-marca">{iniciales}</span>
            </span>
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold">{PERFIL.nombre}</p>
              <p className="cifra text-sm text-muted">{PERFIL.rol} · {PERFIL.ubicacion}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <h2 className="text-3xl font-semibold leading-tight">Datos, código y economía argentina.</h2>
          <p className="mt-5 max-w-[60ch] text-lg text-muted">{PERFIL.bio}</p>
          <p className="mt-4 max-w-[60ch] text-muted">
            Prognosis junta esas herramientas con la economía argentina: series oficiales del BCRA y del INDEC,
            procesadas y visualizadas para tomar mejores decisiones.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Especialidades">
            {PERFIL.especialidades.map((e) => (
              <li key={e} className="border border-border px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-muted">{e}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
