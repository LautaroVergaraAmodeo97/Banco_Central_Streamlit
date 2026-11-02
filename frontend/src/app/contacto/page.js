/**
 * Página "Contacto"
 */

'use client'

import { useState } from 'react'
import { enviarContacto } from '@/services/api'

// sitio_web es un campo trampa oculto: si llega completo, lo envió un bot
const VACIO = { nombre: '', email: '', asunto: '', mensaje: '', sitio_web: '' }

const CAMPO = 'w-full rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent'

export default function Contacto() {
  const [formData, setFormData] = useState(VACIO)
  const [estado, setEstado] = useState('inicial') // inicial | enviando | enviado
  const [error, setError] = useState(null)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEstado('enviando')
    setError(null)
    try {
      await enviarContacto(formData)
      setFormData(VACIO)
      setEstado('enviado')
    } catch (err) {
      setError(err.message)
      setEstado('inicial')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-[1fr_1.4fr]">
      <section>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Contacto</h1>
        <p className="mt-2 text-muted">
          ¿Necesitás un análisis a medida o tenés una consulta sobre los datos? Escribinos y te respondemos a la brevedad.
        </p>

        <dl className="mt-8 space-y-5 text-sm">
          <div>
            <dt className="font-medium">Fuente de los datos</dt>
            <dd className="text-muted">
              Banco Central de la República Argentina ·{' '}
              <a href="https://www.bcra.gob.ar" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                bcra.gob.ar
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium">API pública del BCRA</dt>
            <dd className="text-muted">
              <a
                href="https://www.bcra.gob.ar/BCRAyVos/catalogo-de-APIs-banco-central.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Catálogo de APIs
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        {estado === 'enviado' && (
          <p className="mb-4 rounded-md bg-pos-soft px-3 py-2 text-sm text-pos">Mensaje enviado. ¡Gracias por escribirnos!</p>
        )}
        {error && <p className="mb-4 rounded-md bg-neg-soft px-3 py-2 text-sm text-neg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="block font-medium mb-1">Nombre</span>
              <input name="nombre" value={formData.nombre} onChange={handleChange} required maxLength={100} autoComplete="name" className={CAMPO} />
            </label>
            <label className="block text-sm">
              <span className="block font-medium mb-1">Email</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required maxLength={254} autoComplete="email" className={CAMPO} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="block font-medium mb-1">Asunto</span>
            <input name="asunto" value={formData.asunto} onChange={handleChange} required maxLength={150} className={CAMPO} />
          </label>
          <label className="block text-sm">
            <span className="block font-medium mb-1">Mensaje</span>
            <textarea name="mensaje" value={formData.mensaje} onChange={handleChange} required maxLength={5000} rows={5} className={CAMPO} />
          </label>
          <div className="absolute -left-[10000px]" aria-hidden="true">
            <label>
              No completar este campo
              <input name="sitio_web" value={formData.sitio_web} onChange={handleChange} tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <button
            type="submit"
            disabled={estado === 'enviando'}
            className="w-full rounded-md bg-accent px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {estado === 'enviando' ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </form>
      </section>
    </div>
  )
}
