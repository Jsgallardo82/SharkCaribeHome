import { useEffect, useState } from 'react'
import { HERO, HERO_MODES, TERMS_URL } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Hero.css'

export default function Hero({ onRegister }) {
  const [active, setActive] = useState(0)
  const count = HERO_MODES.length

  useEffect(() => {
    if (count <= 1) return undefined
    const id = setInterval(() => setActive((a) => (a + 1) % count), 6000)
    return () => clearInterval(id)
  }, [count])

  const go = (i) => setActive((i + count) % count)
  const mode = HERO_MODES[active]

  return (
    <section id="inicio" className="hero">
      <div className="hero__carousel" aria-hidden="true">
        {HERO_MODES.map((m, i) => (
          <div
            key={m.id}
            className={`hero__slide hero__slide--${(i % 3) + 1} ${
              i === active ? 'is-active' : ''
            }`}
            style={m.image ? { backgroundImage: `url("${m.image}")` } : undefined}
          >
            {!m.image && <span className="hero__slide-tag">{m.title}</span>}
          </div>
        ))}
      </div>
      <div className="hero__overlay" aria-hidden="true" />

      <div className="container hero__inner">
        <Ticket
          className="hero__ticket ticket--horizontal"
          notchBg="#0b1533"
          stub={
            <div className="hero__stub" key={mode.id}>
              <p className="hero__category">Categoría · {mode.title}</p>
              <p className="hero__subtitle">{mode.text}</p>
              {mode.action === 'modal' ? (
                <button
                  type="button"
                  className="btn btn--primary hero__cta"
                  onClick={onRegister}
                >
                  {mode.cta}
                </button>
              ) : (
                <a
                  href={mode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary hero__cta"
                >
                  {mode.cta}
                </a>
              )}
              {mode.id === 'participante' && (
                <a href={TERMS_URL} className="hero__terms" download>
                  ↓ Descargar términos de referencia
                </a>
              )}
            </div>
          }
        >
          <div className="hero__ticket-main">
            <Barcode variant="dark" className="hero__barcode" />
            {HERO.kicker && <p className="hero__kicker">{HERO.kicker}</p>}
            <h1 className="hero__title">{HERO.title}</h1>
          </div>
        </Ticket>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="hero__nav hero__nav--prev"
            onClick={() => go(active - 1)}
            aria-label="Modo anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero__nav hero__nav--next"
            onClick={() => go(active + 1)}
            aria-label="Modo siguiente"
          >
            ›
          </button>
          <div className="hero__dots">
            {HERO_MODES.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={`hero__dot ${i === active ? 'is-active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Ver inscripción: ${m.title}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
