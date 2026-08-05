import { SPONSOR_BADGES } from '../data/content.js'
import './Sponsors.css'

export default function Sponsors({ onRegister }) {
  return (
    <section id="patrocinadores" className="sponsors">
      <div className="sponsors__overlay" aria-hidden="true" />
      <div className="container sponsors__shell">
        <div className="sponsors__inner">
          <div className="sponsors__mascot">
            <img src="/sharkycolor.png" alt="Sharky, la mascota de Shark Caribe" />
          </div>
          <div className="sponsors__content">
            <p className="sponsors__kicker">Patrocinios</p>
            <h2 className="sponsors__title">
              Lleva tu marca al escenario de Shark Caribe Pitch Competition
            </h2>
            <p className="sponsors__text">
              Conecta con emprendedores, empresarios e inversionistas del Caribe.
              Sé parte de la cuarta edición como patrocinador.
            </p>
            <button
              type="button"
              className="btn btn--primary sponsors__cta"
              onClick={() => onRegister?.('patrocinador')}
            >
              Inscríbete como patrocinador
            </button>
          </div>
        </div>

        <ul className="sponsors__badges" aria-label="Planes de patrocinio">
          {SPONSOR_BADGES.map((badge) => (
            <li
              key={badge.id}
              className={`sponsors__badge sponsors__badge--${badge.id}`}
            >
              {badge.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
