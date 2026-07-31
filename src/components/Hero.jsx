import { useEffect, useState } from 'react'
import { HERO, HERO_MODES } from '../data/content.js'
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
      <div
        className="hero__bg"
        style={{ backgroundImage: 'url("/album/2023/Imagen9.jpg")' }}
        aria-hidden="true"
      />
      <div className="hero__overlay" aria-hidden="true" />

      <div className="container hero__inner">
        <Ticket
          className="hero__ticket ticket--horizontal"
          notchBg="#0b1533"
          stub={
            <div className="hero__stub" key={`${mode.id}-details`}>
              <Barcode variant="light" className="hero__stub-barcode" />
              <ul className="hero__details">
                {(mode.details || []).map((item) => (
                  <li key={item.title} className="hero__detail">
                    <p className="hero__detail-title">{item.title}</p>
                    {(item.text || item.emphasis) && (
                      <p className="hero__detail-text">
                        {item.text ? `${item.text} ` : null}
                        {item.emphasis ? (
                          <span className="hero__detail-emphasis">{item.emphasis}</span>
                        ) : null}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          }
        >
          <div className="hero__ticket-main">
            <div className="hero__brand">
              <Barcode variant="dark" className="hero__barcode" />
              <h1 className="hero__headline">
                <span className="hero__title hero__title--pitch">{HERO.titlePitch}</span>
                <span className="hero__title hero__title--competition">
                  {HERO.titleCompetition}
                </span>
              </h1>
              <div className="hero__brand-block">
                <p className="hero__brand-line">
                  <span className="hero__brand-rule" aria-hidden="true" />
                  <span>{HERO.brandLine}</span>
                  <span className="hero__brand-rule" aria-hidden="true" />
                </p>
                <p className="hero__brand-name">{HERO.brand}</p>
              </div>
              <p className="hero__meta">{HERO.meta}</p>
            </div>

            <div className="hero__category-panel" key={mode.id}>
              <div className="hero__category-badge">
                <span className="hero__category-label">Categoría</span>
                <span className="hero__category-title">{mode.title}</span>
              </div>
              {mode.action === 'modal' ? (
                <button
                  type="button"
                  className="btn btn--primary hero__cta"
                  onClick={() => onRegister(mode.id)}
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
            </div>
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
