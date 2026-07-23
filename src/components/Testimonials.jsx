import { TESTIMONIALS } from '../data/content.js'
import './Testimonials.css'

export default function Testimonials() {
  return (
    <section id="testimonios" className="section">
      <div className="container">
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
    </section>
  )
}
