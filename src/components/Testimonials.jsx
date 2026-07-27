import { TESTIMONIALS } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Testimonials.css'

export default function Testimonials() {
  return (
    <section id="testimonios" className="section">
      <div className="container">
        <Ticket
          className="ticket--section testimonials-ticket"
          stub={
            <div className="testimonials-ticket__stub">
              <span className="testimonials-ticket__stub-label">
                Historias que inspiran
              </span>
              <Barcode variant="light" className="testimonials-ticket__barcode" />
            </div>
          }
        >
          <div className="testimonials-ticket__main">
            <h2 className="section__title">Testimonios</h2>
            <p className="section__subtitle">
              Lo que dicen quienes ya vivieron la experiencia.
            </p>
            <div className="testimonials__grid">
              {TESTIMONIALS.map((t, i) => (
                <figure key={i} className="testimonial-card">
                  <blockquote>"{t.quote}"</blockquote>
                  <figcaption>
                    <span className="testimonial-card__name">{t.name}</span>
                    <span className="testimonial-card__role">{t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Ticket>
      </div>
    </section>
  )
}
