import { ENTRADAS, ATTENDEE_SEAT_TYPES, INSTAGRAM_URL } from '../data/content.js'
import { Barcode } from './Ticket.jsx'
import './Entradas.css'

export default function Entradas({ onRegister }) {
  return (
    <section id="entradas" className="entradas">
      <div className="entradas__glow" aria-hidden="true" />
      <div className="container entradas__inner">
        <header className="entradas__header">
          <p className="entradas__eyebrow">{ENTRADAS.eyebrow}</p>
          <div className="entradas__meta">
            <span className="entradas__meta-item">{ENTRADAS.date}</span>
            <span className="entradas__meta-item">{ENTRADAS.location}</span>
          </div>
          <h2 className="entradas__title">
            {ENTRADAS.titleBefore}
            <span className="entradas__title-accent">{ENTRADAS.titleHighlight}</span>
            {ENTRADAS.titleMid}
            <span className="entradas__title-accent">{ENTRADAS.titleHighlightEnd}</span>
          </h2>
          <p className="entradas__subtitle">{ENTRADAS.subtitle}</p>
        </header>

        <div className="entradas__grid">
          {ATTENDEE_SEAT_TYPES.map((seat) => (
            <article
              key={seat.value}
              className={`entradas__card ${seat.featured ? 'is-featured' : ''}`}
            >
              <div className="entradas__card-notch entradas__card-notch--left" aria-hidden="true" />
              <div className="entradas__card-notch entradas__card-notch--right" aria-hidden="true" />

              <div className="entradas__card-body">
                <div
                  className={`entradas__badge ${seat.featured ? 'entradas__badge--star' : 'entradas__badge--user'}`}
                  aria-hidden="true"
                />
                <h3 className="entradas__card-title">{seat.label}</h3>
                <p className="entradas__card-desc">{seat.description}</p>
                <p className="entradas__card-price">{seat.price}</p>
                <button
                  type="button"
                  className={`btn ${seat.featured ? 'btn--primary' : 'btn--outline'} entradas__card-cta`}
                  onClick={() => onRegister?.('asistente', { seatType: seat.value })}
                >
                  {ENTRADAS.cta}
                </button>
              </div>

              <div className="entradas__card-stub">
                <Barcode
                  variant="light"
                  className={`entradas__barcode ${seat.featured ? '' : 'entradas__barcode--muted'}`}
                />
              </div>
            </article>
          ))}
        </div>

        <footer className="entradas__footer">
          <span>{ENTRADAS.footerNote}</span>
          <span className="entradas__footer-sep" aria-hidden="true">
            |
          </span>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            @shark.caribe
          </a>
          <span className="entradas__footer-sep" aria-hidden="true">
            |
          </span>
          <span>www.sharkcaribe.co</span>
        </footer>
      </div>
    </section>
  )
}
