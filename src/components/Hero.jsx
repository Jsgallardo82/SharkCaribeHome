import { useEffect, useState } from 'react'
import {
  ALLIES,
  ATTENDEE_SEAT_TYPES,
  ENTRADAS,
  HERO,
  HERO_SLIDES,
  ORGANIZER,
} from '../data/content.js'
import { sharkySoundInteractionProps } from '../lib/sharkySound.js'
import './Hero.css'

const HERO_ALLY_LOGOS = [
  ...(ORGANIZER?.logo
    ? [{ name: ORGANIZER.name, logo: ORGANIZER.logo }]
    : []),
  ...ALLIES.filter((a) => a.logo),
]

function seatForSlide(slide) {
  return ATTENDEE_SEAT_TYPES.find((s) => s.value === slide.seatType) || null
}

export default function Hero({ onRegister }) {
  const [active, setActive] = useState(0)
  const count = HERO_SLIDES.length

  useEffect(() => {
    if (count <= 1) return undefined

    let id = null
    const start = () => {
      if (id != null) return
      id = setInterval(() => setActive((a) => (a + 1) % count), 6000)
    }
    const stop = () => {
      if (id == null) return
      clearInterval(id)
      id = null
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [count])

  const go = (i) => setActive((i + count) % count)

  return (
    <section id="inicio" className="hero" aria-roledescription="carrusel">
      <div
        className="hero__bg"
        style={{ backgroundImage: 'url("/album/2023/Imagen9.jpg")' }}
        aria-hidden="true"
      />
      <div className="hero__overlay" aria-hidden="true" />

      <div className="hero__track">
        {HERO_SLIDES.map((slide, i) => {
          const isActive = i === active
          const seat = slide.kind === 'ticket' ? seatForSlide(slide) : null

          return (
            <figure
              key={slide.id}
              className={`hero__slide ${isActive ? 'is-active' : ''} ${
                slide.kind === 'ticket' ? 'hero__slide--ticket' : ''
              }`}
              aria-hidden={!isActive}
            >
              {slide.kind === 'image' ? (
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="hero__image"
                  draggable={false}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              ) : seat ? (
                <div className="hero__ticket">
                  <div
                    className={`hero__ticket-card ${
                      seat.featured ? 'is-featured' : ''
                    }`}
                  >
                    <div className="hero__ticket-copy">
                      <p className="hero__ticket-meta">
                        <span>{ENTRADAS.date}</span>
                        <span aria-hidden="true">·</span>
                        <span className="hero__ticket-venue">
                          <img
                            src="/dancarton.svg"
                            alt=""
                            className="hero__ticket-venue-logo"
                            aria-hidden="true"
                          />
                          <span>{ENTRADAS.location}</span>
                        </span>
                      </p>
                      <h2 className="hero__ticket-title">{seat.label}</h2>
                      <p className="hero__ticket-desc">{seat.description}</p>
                      <p className="hero__ticket-price">{seat.priceLabel}</p>
                      <button
                        type="button"
                        className={`btn ${
                          seat.featured ? 'btn--primary' : 'btn--outline'
                        } hero__ticket-cta`}
                        onClick={() =>
                          onRegister?.('asistente', { seatType: seat.value })
                        }
                      >
                        {ENTRADAS.cta}
                      </button>
                    </div>

                    <div className="hero__ticket-media">
                      <img
                        src={
                          seat.featured ? '/sharky.png' : '/sharkycolor.png'
                        }
                        alt="Sharky, mascota de Shark Caribe"
                        className="hero__ticket-sharky"
                        loading={isActive ? 'eager' : 'lazy'}
                        decoding="async"
                        {...sharkySoundInteractionProps()}
                      />
                    </div>

                    {HERO_ALLY_LOGOS.length > 0 ? (
                      <ul className="hero__allies" aria-label="Aliados">
                        {HERO_ALLY_LOGOS.map((ally) => (
                          <li key={ally.name} className="hero__allies-item">
                            <img
                              src={ally.logo}
                              alt={ally.name}
                              className="hero__allies-logo"
                              loading="lazy"
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </figure>
          )
        })}
      </div>

      <div className="hero__register">
        <div className="hero__register-row">
          <p className="hero__support">{HERO.supportMessage}</p>
          <button
            type="button"
            className="btn hero__register-btn"
            onClick={() =>
              onRegister?.('asistente', { seatType: 'preferencial' })
            }
          >
            {HERO.ctaLabel}
          </button>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="hero__nav hero__nav--prev"
            onClick={() => go(active - 1)}
            aria-label="Imagen anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero__nav hero__nav--next"
            onClick={() => go(active + 1)}
            aria-label="Imagen siguiente"
          >
            ›
          </button>
          <div className="hero__dots" role="tablist" aria-label="Diapositivas del hero">
            {HERO_SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`hero__dot ${i === active ? 'is-active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Ir a diapositiva ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
