import { VENTURES } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Ventures.css'

const SECTIONS = [
  { id: 'inscrito', label: 'Inscritos' },
  { id: 'segunda_ronda', label: 'Segunda ronda' },
]

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

function VentureGrid({ items }) {
  if (items.length === 0) {
    return (
      <p className="ventures__empty">Aún no hay emprendimientos en esta lista.</p>
    )
  }

  return (
    <ul className="ventures__grid">
      {items.map((venture) => (
        <li key={`${venture.round}-${venture.name}`} className="venture">
          <div className="venture__logo">
            {venture.logo ? (
              <img src={venture.logo} alt="" loading="lazy" />
            ) : (
              <span className="venture__placeholder" aria-hidden="true">
                {initials(venture.name)}
              </span>
            )}
          </div>
          <p className="venture__name">{venture.name}</p>
          {venture.sector && <p className="venture__sector">{venture.sector}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function Ventures() {
  return (
    <section id="emprendimientos" className="section">
      <div className="container">
        <Ticket
          className="ticket--section ventures-ticket"
          stub={
            <div className="ventures-ticket__stub">
              <span className="ventures-ticket__stub-label">Concursantes</span>
              <Barcode variant="light" className="ventures-ticket__barcode" />
            </div>
          }
        >
          <div className="ventures-ticket__main">
            <h2 className="section__title">Emprendimientos</h2>
            <p className="section__subtitle">
              Proyectos inscritos y quienes avanzan a la siguiente ronda.
            </p>

            <div className="ventures__sections">
              {SECTIONS.map((section) => {
                const items = VENTURES.filter((v) => v.round === section.id)
                return (
                  <div key={section.id} className="ventures__block">
                    <h3 className="ventures__heading">
                      {section.label}
                      <span className="ventures__count">{items.length}</span>
                    </h3>
                    <VentureGrid items={items} />
                  </div>
                )
              })}
            </div>
          </div>
        </Ticket>
      </div>
    </section>
  )
}
