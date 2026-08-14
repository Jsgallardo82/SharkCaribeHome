import {
  COMPETITION,
  COMPETITOR_REGISTRATION_CLOSED,
  SCHEDULE,
  TERMS_URL,
  isCompetitorRegistrationOpen,
} from '../data/content.js'
import './Competition.css'

export default function Competition({ onRegister }) {
  const competitorOpen = isCompetitorRegistrationOpen()

  return (
    <section id="competidores" className="competition">
      <div className="container competition__grid">
        <div className="competition__col">
          <p className="competition__eyebrow">{COMPETITION.eyebrow}</p>
          <h2 className="competition__title">{COMPETITION.title}</h2>
          <p className="competition__intro">{COMPETITION.intro}</p>

          <h3 className="competition__heading">Categorías de competición</h3>
          <ul className="competition__list">
            {COMPETITION.categories.map((cat) => (
              <li key={cat.label}>
                <strong>{cat.label}</strong>
                <span>{cat.description}</span>
              </li>
            ))}
          </ul>

          <h3 className="competition__heading">Sectores convocados</h3>
          <p className="competition__note">{COMPETITION.sectorsNote}</p>
          <ul className="competition__chips">
            {COMPETITION.sectors.map((sector) => (
              <li key={sector}>{sector}</li>
            ))}
          </ul>

          {competitorOpen && (
            <>
              <h3 className="competition__heading">Requisitos</h3>
              <ul className="competition__bullets">
                {COMPETITION.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}

          <div className="competition__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onRegister('participante')}
            >
              {competitorOpen
                ? COMPETITION.cta
                : COMPETITOR_REGISTRATION_CLOSED.ctaLabel}
            </button>
            <a
              href={TERMS_URL}
              className="btn btn--outline competition__terms"
              download
            >
              ↓ Descargar términos de referencia
            </a>
          </div>
        </div>

        <div className="competition__col competition__col--schedule">
          <p className="competition__eyebrow">{SCHEDULE.eyebrow}</p>
          <h2 className="competition__title">{SCHEDULE.title}</h2>
          <p className="competition__intro">{SCHEDULE.intro}</p>

          <ol className="competition__timeline">
            {SCHEDULE.milestones.map((item) => (
              <li key={item.date}>
                <span className="competition__date">{item.date}</span>
                <span className="competition__event">{item.event}</span>
              </li>
            ))}
          </ol>

          <h3 className="competition__heading">{SCHEDULE.galaTitle}</h3>
          <p className="competition__note">{SCHEDULE.galaSubtitle}</p>
          <ul className="competition__gala">
            {SCHEDULE.galaAgenda.map((item) => (
              <li key={item.time}>
                <strong>{item.time}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
