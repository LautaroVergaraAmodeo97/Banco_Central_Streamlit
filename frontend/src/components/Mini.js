/**
 * Línea mínima (sparkline) en SVG con el último punto destacado
 */

export default function Mini({ valores, className = 'h-8 w-full' }) {
  if (!valores || valores.length < 2) return null
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const rango = max - min || 1
  const puntos = valores.map((v, i) => [(i / (valores.length - 1)) * 100, 30 - ((v - min) / rango) * 26 - 2])
  const d = puntos.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const [ux, uy] = puntos.at(-1)

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={ux} cy={uy} r="1.6" fill="var(--signal)" />
    </svg>
  )
}
