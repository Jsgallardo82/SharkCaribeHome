import { useEffect, useState } from 'react'
import { HERO, HERO_SLIDES } from '../data/content.js'
import './Hero.css'

export default function Hero({ onRegister }) {
  const [active, setActive] = useState(0)
  const count = HERO_SLIDES.length

  useEffect(() => {
    if (count <= 1) return undefined
    const id = setInterval(() => setActive((a) => (a + 1) % count), 6000)
    return () => clearInterval(id)
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
        {HERO_SLIDES.map((slide, i) => (
          <figure
            key={slide.id}
            className={`hero__slide ${i === active ? 'is-active' : ''}`}
            aria-hidden={i !== active}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="hero__image"
              draggable={false}
            />
          </figure>
        ))}
      </div>

      <div className="hero__register">
        <div className="hero__register-row">
          <p className="hero__support">{HERO.supportMessage}</p>
          <button
            type="button"
            className="btn hero__register-btn"
            onClick={() => onRegister?.('unificado')}
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
                aria-label={`Ir a imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
