/**
 * Links a GitHub y LinkedIn del autor, con íconos
 */

import { PERFIL } from '@/lib/perfil'

const ICONOS = {
  GitHub: 'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z',
  LinkedIn: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v11H3v-11zm7 0h3.8v1.6h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13v5.33h-4v-4.73c0-1.13-.02-2.58-1.57-2.58-1.58 0-1.82 1.23-1.82 2.5v4.81h-4v-11z',
}

export default function RedesSociales({ className = '' }) {
  const redes = [
    { nombre: 'GitHub', url: PERFIL.github },
    { nombre: 'LinkedIn', url: PERFIL.linkedin },
  ].filter((r) => r.url)

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {redes.map((r) => (
        <li key={r.nombre}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 border border-border px-3 font-display text-sm font-semibold hover:bg-surface-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={ICONOS[r.nombre]} />
            </svg>
            {r.nombre}
          </a>
        </li>
      ))}
    </ul>
  )
}
