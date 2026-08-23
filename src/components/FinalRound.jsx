import { useEffect, useRef, useState } from 'react'
import { FINAL_ROUND } from '../data/content.js'
import { fetchPublicVentures, isSupabaseConfigured } from '../lib/supabase.js'
import { VentureGrid, VentureModal } from './Ventures.jsx'
import './Ventures.css'
import './FinalRound.css'

const FLOAT_EMOJIS = ['🏆', '✨', '🦈', '🔥', '📅', '📍']

export default function FinalRound({ onRegister }) {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [finalists, setFinalists] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeVenture, setActiveVenture] = useState(null)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isSupabaseConfigured) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const data = await fetchPublicVentures()
        if (cancelled) return
        setFinalists(
          data.filter((v) => String(v.stage || '').toLowerCase() === 'final')
        )
      } catch {
        if (!cancelled) setFinalists([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      id="gran-final"
      ref={sectionRef}
      className={`final-round ${visible ? 'is-visible' : ''}`}
    >
      <div className="final-round__glow" aria-hidden="true" />
      <div className="final-round__grid" aria-hidden="true" />

      <div className="final-round__floats" aria-hidden="true">
        {FLOAT_EMOJIS.map((emoji, i) => (
          <span
            key={`${emoji}-${i}`}
            className={`final-round__float final-round__float--${i + 1}`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="container final-round__inner">
        {/* 1) Concursantes / semifinalistas */}
        <div className="final-round__finalists">
          <h3 className="final-round__finalists-title">
            <span aria-hidden="true">🦈</span> {FINAL_ROUND.finalistsTitle}
          </h3>

          {loading ? (
            <p className="final-round__status">Cargando semifinalistas…</p>
          ) : finalists.length === 0 ? (
            <p className="final-round__status">{FINAL_ROUND.emptyFinalists}</p>
          ) : (
            <div className="final-round__ventures">
              <VentureGrid
                ventures={finalists}
                onOpen={setActiveVenture}
              />
            </div>
          )}
        </div>

        {/* 2) Programa de entrenamiento + CTA entradas */}
        <div className="final-round__training">
          <h3 className="final-round__training-title">
            {FINAL_ROUND.trainingTitle}
          </h3>
          <p className="final-round__training-body">{FINAL_ROUND.trainingBody}</p>
          <div className="final-round__training-actions">
            {typeof onRegister === 'function' ? (
              <button
                type="button"
                className="final-round__tickets-cta"
                onClick={() => onRegister('asistente')}
              >
                {FINAL_ROUND.ticketsCta}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <a className="final-round__tickets-cta" href={FINAL_ROUND.ticketsHref}>
                {FINAL_ROUND.ticketsCta}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>

        <p className="final-round__eyebrow">
          <span aria-hidden="true">🚨</span> {FINAL_ROUND.eyebrow}
        </p>

        <div className="final-round__badge">
          <span className="final-round__badge-pulse" aria-hidden="true" />
          <span className="final-round__badge-text">
            🎯 {FINAL_ROUND.badge}
          </span>
        </div>

        <div className="final-round__hero">
          <div className="final-round__hero-copy">
            <h2 className="final-round__title">{FINAL_ROUND.title}</h2>
            <p className="final-round__lead">{FINAL_ROUND.lead}</p>
            <p className="final-round__date-callout">
              <span aria-hidden="true">📅</span>
              <strong>{FINAL_ROUND.dateLabel}</strong>
              <span> · {FINAL_ROUND.yearLabel}</span>
            </p>
          </div>
          <div className="final-round__hero-art">
            <img
              src={FINAL_ROUND.sharky}
              alt="Sharky, mascota de Shark Caribe"
              className="final-round__sharky"
            />
          </div>
        </div>

        {/* 3) Fecha, horario y lugar */}
        <div className="final-round__meta">
          <article className="final-round__card final-round__card--when">
            <span className="final-round__card-emoji" aria-hidden="true">
              📅
            </span>
            <div className="final-round__when">
              <div>
                <p className="final-round__card-label">Fecha</p>
                <p className="final-round__card-value">{FINAL_ROUND.dateLabel}</p>
                <p className="final-round__card-sub">{FINAL_ROUND.yearLabel}</p>
              </div>
              <div className="final-round__when-sep" aria-hidden="true" />
              <div>
                <p className="final-round__card-label">Horario</p>
                <p className="final-round__card-value">{FINAL_ROUND.timeLabel}</p>
              </div>
            </div>
          </article>

          <article className="final-round__card final-round__card--place">
            <div className="final-round__place-split">
              <div className="final-round__place-info">
                <div className="final-round__place-head">
                  <span className="final-round__card-emoji" aria-hidden="true">
                    📍
                  </span>
                  <div>
                    <p className="final-round__card-label">Lugar</p>
                    <p className="final-round__card-value">{FINAL_ROUND.venue}</p>
                    <p className="final-round__card-sub">{FINAL_ROUND.address}</p>
                  </div>
                </div>

                <a
                  className="final-round__maps"
                  href={FINAL_ROUND.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span aria-hidden="true">🗺️</span>
                  {FINAL_ROUND.mapsCta}
                  <span className="final-round__maps-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              </div>

              <div className="final-round__map-wrap">
                <iframe
                  className="final-round__map"
                  title="Ubicación Hotel Dann Carlton Barranquilla"
                  src={FINAL_ROUND.mapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </article>
        </div>
      </div>

      {activeVenture ? (
        <VentureModal
          venture={activeVenture}
          onClose={() => setActiveVenture(null)}
          onRegister={onRegister}
        />
      ) : null}
    </section>
  )
}
