import {
  MUESTRA_COMERCIAL,
  EXHIBITOR_STAND_TYPES,
} from '../data/content.js'
import './MuestraComercial.css'

export default function MuestraComercial({ onRegister }) {
  return (
    <section id="muestra-comercial" className="muestra">
      <div className="muestra__glow" aria-hidden="true" />
      <div className="container muestra__inner">
        <header className="muestra__header">
          <p className="muestra__eyebrow">{MUESTRA_COMERCIAL.eyebrow}</p>
          <h2 className="muestra__title">{MUESTRA_COMERCIAL.title}</h2>
          <p className="muestra__intro">{MUESTRA_COMERCIAL.intro}</p>
        </header>

        <div className="muestra__layout">
          <div className="muestra__offers">
            <p className="muestra__includes-label">{MUESTRA_COMERCIAL.includesLabel}</p>
            <ul className="muestra__includes">
              {MUESTRA_COMERCIAL.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="muestra__stands">
              {EXHIBITOR_STAND_TYPES.map((stand) => (
                <article
                  key={stand.value}
                  className={`muestra__stand ${stand.featured ? 'is-featured' : ''}`}
                >
                  <h3 className="muestra__stand-name">{stand.shortLabel}</h3>
                  <p className="muestra__stand-size">{stand.dimensions}</p>
                  <p className="muestra__stand-price">
                    <span className="muestra__stand-price-label">Valor</span>
                    {stand.priceLabel}
                  </p>
                  <button
                    type="button"
                    className={`btn ${stand.featured ? 'btn--primary' : 'btn--outline'} muestra__stand-cta`}
                    onClick={() =>
                      onRegister?.('expositor', { standType: stand.value })
                    }
                  >
                    {MUESTRA_COMERCIAL.cta}
                  </button>
                </article>
              ))}
            </div>

            <p className="muestra__terms">{MUESTRA_COMERCIAL.terms}</p>
          </div>

          <aside className="muestra__venue" aria-label="Ubicación de la muestra comercial">
            <div className="muestra__venue-sheet">
              <p className="muestra__venue-kicker">Ubicación</p>
              <h3 className="muestra__venue-name">{MUESTRA_COMERCIAL.venueLabel}</h3>
              <p className="muestra__venue-place">{MUESTRA_COMERCIAL.venuePlace}</p>
              <div className="muestra__venue-photo">
                <img
                  src="/stand.jpeg"
                  alt="Stand de la muestra comercial Shark Caribe"
                  loading="lazy"
                />
              </div>
            </div>
          </aside>
        </div>

        <p className="muestra__closing">{MUESTRA_COMERCIAL.closing}</p>
      </div>
    </section>
  )
}
