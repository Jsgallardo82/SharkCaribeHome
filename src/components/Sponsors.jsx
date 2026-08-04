import './Sponsors.css'

export default function Sponsors({ onRegister }) {
  return (
    <section id="patrocinadores" className="sponsors">
      <div className="sponsors__overlay" aria-hidden="true" />
      <div className="container sponsors__inner">
        <div className="sponsors__mascot">
          <img src="/sharkycolor.png" alt="Sharky, la mascota de Shark Caribe" />
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
          <button
            type="button"
            className="btn btn--primary sponsors__cta"
            onClick={() => onRegister?.('patrocinador')}
          >
            Inscríbete como patrocinador
          </button>
        </div>
      </div>
    </section>
  )
}
