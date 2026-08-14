import { useEffect, useRef, useState } from 'react'
import { PITCH_ROUND } from '../data/content.js'
import './PitchRound.css'

const FLOAT_EMOJIS = ['⚡', '🏆', '✨', '🔥', '📅', '📍']

export default function PitchRound() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

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

  return (
    <section
      id="primera-ronda"
      ref={sectionRef}
      className={`pitch-round ${visible ? 'is-visible' : ''}`}
    >
      <div className="pitch-round__glow" aria-hidden="true" />
      <div className="pitch-round__grid" aria-hidden="true" />

      <div className="pitch-round__floats" aria-hidden="true">
        {FLOAT_EMOJIS.map((emoji, i) => (
          <span
            key={`${emoji}-${i}`}
            className={`pitch-round__float pitch-round__float--${i + 1}`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="container pitch-round__inner">
        <p className="pitch-round__eyebrow">
          <span aria-hidden="true">🚨</span> {PITCH_ROUND.eyebrow}
        </p>

        <div className="pitch-round__badge">
          <span className="pitch-round__badge-pulse" aria-hidden="true" />
          <span className="pitch-round__badge-text">
            🎯 {PITCH_ROUND.badge}
          </span>
        </div>

        <div className="pitch-round__hero">
          <div className="pitch-round__hero-copy">
            <h2 className="pitch-round__title">{PITCH_ROUND.title}</h2>
            <p className="pitch-round__lead">
              Los competidores suben al escenario. Los jueces deciden quién
              avanza.
            </p>
          </div>
          <div className="pitch-round__hero-art">
            <img
              src={PITCH_ROUND.sharky}
              alt="Sharky, mascota de Shark Caribe"
              className="pitch-round__sharky"
            />
          </div>
        </div>

        <div className="pitch-round__meta">
          <article className="pitch-round__card pitch-round__card--when">
            <span className="pitch-round__card-emoji" aria-hidden="true">
              📅
            </span>
            <div className="pitch-round__when">
              <div>
                <p className="pitch-round__card-label">Fecha</p>
                <p className="pitch-round__card-value">{PITCH_ROUND.dateLabel}</p>
              </div>
              <div className="pitch-round__when-sep" aria-hidden="true" />
              <div>
                <p className="pitch-round__card-label">Horario</p>
                <p className="pitch-round__card-value">{PITCH_ROUND.timeLabel}</p>
              </div>
            </div>
          </article>

          <article className="pitch-round__card pitch-round__card--place">
            <div className="pitch-round__place-head">
              <span className="pitch-round__card-emoji" aria-hidden="true">
                📍
              </span>
              <div>
                <p className="pitch-round__card-label">Lugar</p>
                <p className="pitch-round__card-value">{PITCH_ROUND.venue}</p>
                <p className="pitch-round__card-sub">{PITCH_ROUND.address}</p>
              </div>
            </div>

            <div className="pitch-round__map-wrap">
              <iframe
                className="pitch-round__map"
                title="Ubicación Hotel IBIS Barranquilla · Salón Nexus"
                src={PITCH_ROUND.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <a
              className="pitch-round__maps"
              href={PITCH_ROUND.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true">🗺️</span>
              {PITCH_ROUND.mapsCta}
              <span className="pitch-round__maps-arrow" aria-hidden="true">
                →
              </span>
            </a>
          </article>
        </div>

        <div className="pitch-round__judges">
          <h3 className="pitch-round__judges-title">
            <span aria-hidden="true">👨‍⚖️</span> {PITCH_ROUND.judgesTitle}
          </h3>
          <ul className="pitch-round__judges-list">
            {PITCH_ROUND.judges.map((name, i) => (
              <li
                key={name}
                className="pitch-round__judge"
                style={{ '--judge-i': i }}
              >
                <span className="pitch-round__judge-emoji" aria-hidden="true">
                  ⭐
                </span>
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
