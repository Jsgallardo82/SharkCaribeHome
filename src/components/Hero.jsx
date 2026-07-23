import { HERO, TERMS_URL } from '../data/content.js'
import './Hero.css'

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="container hero__content">
        {HERO.kicker && <p className="hero__kicker">{HERO.kicker}</p>}
        <h1 className="hero__title">{HERO.title}</h1>
        <p className="hero__subtitle">{HERO.subtitle}</p>
        <div className="hero__actions">
          <a
            href={HERO.ctaHref}
            className="btn btn--primary hero__cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {HERO.ctaLabel}
          </a>
          <a href={TERMS_URL} className="hero__terms" download>
            ↓ Descargar términos de referencia
          </a>
        </div>
      </div>
    </section>
  )
}
