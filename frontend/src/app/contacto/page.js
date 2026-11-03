/**
 * Página "Contacto"
 */

'use client'

import { useState } from 'react'
import { enviarContacto } from '@/services/api'

// sitio_web es un campo trampa oculto: si llega completo, lo envió un bot
const VACIO = { nombre: '', email: '', asunto: '', mensaje: '', sitio_web: '' }

const CAMPO = 'mt-2 w-full min-h-11 border border-border bg-bg px-3 py-2'

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
    <section className="contenedor py-12">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="etiqueta">Contacto</p>
          <h1 className="mt-2 text-4xl font-semibold">Contanos qué decisión tenés que tomar.</h1>
          <p className="mt-4 text-muted">
            Fijar precios, renegociar costos, financiarte o invertir: armamos el análisis con los datos que importan para tu
            rubro. Respondemos a la brevedad.
          </p>
          <dl className="mt-8 grid gap-5 border-t border-border pt-6 text-sm">
            <div>
              <dt className="etiqueta">Fuentes de datos</dt>
              <dd className="mt-1">
                <a href="https://www.bcra.gob.ar" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">BCRA</a>
                {' · '}
                <a href="https://www.indec.gob.ar" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">INDEC</a>
              </dd>
            </div>
            <div>
              <dt className="etiqueta">Cobertura</dt>
              <dd className="mt-1">Series desde 1996 · comercio exterior desde 1986 · inflación desde 1992</dd>
            </div>
          </dl>
        </div>

        <form onSubmit={handleSubmit} className="panel grid gap-5 p-5 sm:p-7 lg:col-span-6 lg:col-start-7">
          {estado === 'enviado' && (
            <p className="border border-pos/40 bg-pos-soft px-3 py-2 text-sm text-pos" role="status">
              Mensaje enviado. ¡Gracias por escribirnos!
            </p>
          )}
          {error && <p className="border border-neg/40 bg-neg-soft px-3 py-2 text-sm text-neg" role="alert">{error}</p>}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="etiqueta">Nombre</span>
              <input name="nombre" value={formData.nombre} onChange={handleChange} required maxLength={100} autoComplete="name" className={CAMPO} />
            </label>
            <label className="block">
              <span className="etiqueta">Email</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required maxLength={254} autoComplete="email" className={CAMPO} />
            </label>
          </div>
          <label className="block">
            <span className="etiqueta">Asunto</span>
            <input name="asunto" value={formData.asunto} onChange={handleChange} required maxLength={150} className={CAMPO} />
          </label>
          <label className="block">
            <span className="etiqueta">Mensaje</span>
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
            className="min-h-12 bg-accent px-6 font-display text-[15px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
          >
            {estado === 'enviando' ? 'Enviando…' : 'Enviar consulta'}
          </button>
        </form>
      </div>
    </section>
  )
}
