/**
 * Wordmark de Prognosis con el degradado del logo y su lema
 */

export default function Marca({ conLema = true }) {
  return (
    <span className="flex flex-col leading-none">
      <span className="w-fit texto-marca font-marca text-[22px] font-bold tracking-[0.08em]">PROGNOSIS</span>
      {conLema && (
        <span className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
          Data · predicción · insights
        </span>
      )}
    </span>
  )
}
