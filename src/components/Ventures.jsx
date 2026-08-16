import { useEffect, useRef, useState } from 'react'
import { fetchPublicVentures, isSupabaseConfigured } from '../lib/supabase'
import './Ventures.css'

function VentureModal({ venture, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [onClose])

  return (
    <div
      className="venture-modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="venture-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venture-modal-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="venture-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <header className="venture-modal__header">
          <h2 id="venture-modal-title">{venture.name}</h2>
          {venture.sector ? <p>{venture.sector}</p> : null}
        </header>

        <div className="venture-modal__media">
          {venture.photo ? (
            <div className="venture-modal__photo">
              <img
                src={encodeURI(venture.photo)}
                alt={`Equipo de ${venture.name}`}
              />
            </div>
          ) : null}
          <div className="venture-modal__logo">
            {venture.logo ? (
              <img src={venture.logo} alt={`Logo de ${venture.name}`} />
            ) : (
              <span className="venture__logo-fallback" aria-hidden="true">
                {venture.name.slice(0, 1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VentureGrid({ ventures, onOpen }) {
  return (
    <div className="ventures__grid">
      {ventures.map((venture) => (
        <article key={venture.id} className="venture">
          <div
            className={`venture__media${venture.photo ? '' : ' venture__media--logo-only'}`}
          >
            {venture.photo ? (
              <button
                type="button"
                className="venture__photo"
                onClick={() => onOpen(venture)}
                aria-label={`Ver foto y logo de ${venture.name}`}
              >
                <img
                  src={encodeURI(venture.photo)}
                  alt={`Equipo de ${venture.name}`}
                  loading="lazy"
                />
              </button>
            ) : null}
            <button
              type="button"
              className="venture__logo"
              onClick={() => onOpen(venture)}
              aria-label={`Ver detalle de ${venture.name}`}
            >
              {venture.logo ? (
                <img src={venture.logo} alt={`Logo de ${venture.name}`} loading="lazy" />
              ) : (
                <span className="venture__logo-fallback" aria-hidden="true">
                  {venture.name.slice(0, 1)}
                </span>
              )}
            </button>
          </div>
          <h3>{venture.name}</h3>
          {venture.sector ? <p className="venture__meta">{venture.sector}</p> : null}
        </article>
      ))}
    </div>
  )
}

export default function Ventures() {
  const [ventures, setVentures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeVenture, setActiveVenture] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadVentures() {
      if (!isSupabaseConfigured) {
        if (!cancelled) {
          setError('Supabase no está configurado.')
          setLoading(false)
        }
        return
      }

      try {
        const data = await fetchPublicVentures()
        if (!cancelled) {
          setVentures(data)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'No pudimos cargar los emprendimientos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadVentures()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="emprendimientos" className="section ventures">
      <div className="container">
        <header className="section__header ventures__header">
          <h2 className="ventures__title">
            <span className="ventures__title-line">Ellos siguen en la competencia</span>
            <span className="ventures__title-line">Competidores Clasificados - Reto 2</span>
          </h2>
        </header>

        {loading && <p className="ventures__status">Cargando emprendimientos…</p>}
        {!loading && error && <p className="ventures__status ventures__status--error">{error}</p>}
        {!loading && !error && ventures.length === 0 && (
          <p className="ventures__status">Pronto verás aquí a los emprendimientos clasificados.</p>
        )}
        {!loading && !error && ventures.length > 0 && (
          <VentureGrid ventures={ventures} onOpen={setActiveVenture} />
        )}
      </div>

      {activeVenture ? (
        <VentureModal venture={activeVenture} onClose={() => setActiveVenture(null)} />
      ) : null}
    </section>
  )
}
