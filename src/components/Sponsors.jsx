import { SPONSOR_URL } from '../data/content.js'
import './Sponsors.css'

export default function Sponsors() {
  return (
    <section id="patrocinadores" className="sponsors">
      <div className="sponsors__overlay" aria-hidden="true" />
      <div className="container sponsors__inner">
        <div className="sponsors__mascot">
          <img src="/sharky.png" alt="Sharky, la mascota de Shark Caribe" />
        </div>
        <div className="sponsors__content">
          <p className="sponsors__kicker">Patrocinios y muestra comercial</p>
          <h2 className="sponsors__title">
            Lleva tu marca al escenario de Shark Caribe
          </h2>
          <p className="sponsors__text">
            Conecta con emprendedores, empresarios e inversionistas del Caribe.
            Sé parte de la cuarta edición como patrocinador.
          </p>
          <a
            href={SPONSOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary sponsors__cta"
          >
            Inscríbete como patrocinador
          </a>
        </div>
      </div>
    </section>
  )
}
