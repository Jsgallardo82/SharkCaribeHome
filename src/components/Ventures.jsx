import { useEffect, useRef, useState } from 'react'
import { fetchPublicVentures, isSupabaseConfigured } from '../lib/supabase'
import './Ventures.css'

export function VentureModal({ venture, onClose, onRegister }) {
  const panelRef = useRef(null)
  const photos = venture.photos?.length
    ? venture.photos
    : venture.photo
      ? [venture.photo]
      : []

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

  const category = String(venture.category || '').toLowerCase()
  const categoryClass =
    category === 'silver' || category === 'prime' || category === 'junior'
      ? `venture-modal--${category}`
      : ''

  function handleSupportClick() {
    onClose()
    onRegister?.('asistente', {
      accompaniedCompetitorId: venture.id || '',
      ventureName: venture.name || '',
    })
  }

  return (
    <div
      className="venture-modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`venture-modal${categoryClass ? ` ${categoryClass}` : ''}`}
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
          <div className="venture-modal__title-row">
            <h2 id="venture-modal-title">{venture.name}</h2>
            {venture.categoryLabel ? (
              <span
                className={`venture-modal__badge${
                  category ? ` venture-modal__badge--${category}` : ''
                }`}
              >
                {venture.categoryLabel}
              </span>
            ) : null}
          </div>
          {venture.sectorLabel ? (
            <p className="venture-modal__sector">{venture.sectorLabel}</p>
          ) : null}
          {venture.fullName ? (
            <p className="venture-modal__person">{venture.fullName}</p>
          ) : null}
        </header>

        <div
          className={`venture-modal__media${
            photos.length > 1 ? ' venture-modal__media--multi' : ''
          }`}
        >
          {photos.length > 0 ? (
            <div
              className={`venture-modal__photos${
                photos.length > 1 ? ' venture-modal__photos--multi' : ''
              }`}
            >
              {photos.map((src) => (
                <div key={src} className="venture-modal__photo">
                  <img
                    src={encodeURI(src)}
                    alt={`Equipo de ${venture.name}`}
                  />
                </div>
              ))}
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

        {typeof onRegister === 'function' ? (
          <div className="venture-modal__support">
            <p className="venture-modal__support-text">
              Apoya a {venture.name || 'este concursante'}: compra tu ticket y
              vive el Gran Pitch Competition.
            </p>
            <button
              type="button"
              className="btn venture-modal__support-cta"
              onClick={handleSupportClick}
            >
              Compra un ticket
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function VentureGrid({ ventures, onOpen }) {
  return (
    <div className="ventures__grid">
      {ventures.map((venture) => {
        const photos = venture.photos?.length
          ? venture.photos
          : venture.photo
            ? [venture.photo]
            : []
        const hasPhotos = photos.length > 0
        const multi = photos.length > 1

        return (
          <article key={venture.id} className="venture">
            <div
              className={`venture__media${
                hasPhotos ? '' : ' venture__media--logo-only'
              }${multi ? ' venture__media--multi' : ''}`}
            >
              {hasPhotos ? (
                <div
                  className={`venture__photos${
                    multi ? ' venture__photos--multi' : ''
                  }`}
                >
                  {photos.map((src) => (
                    <button
                      key={src}
                      type="button"
                      className="venture__photo"
                      onClick={() => onOpen(venture)}
                      aria-label={`Ver fotos y logo de ${venture.name}`}
                    >
                      <img
                        src={encodeURI(src)}
                        alt={`Equipo de ${venture.name}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className="venture__logo"
                onClick={() => onOpen(venture)}
                aria-label={`Ver detalle de ${venture.name}`}
              >
                {venture.logo ? (
                  <img
                    src={venture.logo}
                    alt={`Logo de ${venture.name}`}
                    loading="lazy"
                  />
                ) : (
                  <span className="venture__logo-fallback" aria-hidden="true">
                    {venture.name.slice(0, 1)}
                  </span>
                )}
              </button>
            </div>
            <h3>{venture.name}</h3>
            {venture.sectorLabel ? (
              <p className="venture__meta">{venture.sectorLabel}</p>
            ) : null}
          </article>
        )
      })}
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
