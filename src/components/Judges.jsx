import { JUDGES } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Judges.css'

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

export default function Judges() {
  return (
    <section id="jurados" className="section">
      <div className="container">
        <Ticket
          className="ticket--section judges-ticket"
          stub={
            <div className="judges-ticket__stub">
              <span className="judges-ticket__stub-label">El jurado</span>
              <Barcode variant="light" className="judges-ticket__barcode" />
            </div>
          }
        >
          <div className="judges-ticket__main">
            <h2 className="section__title">Jurados</h2>
            <p className="section__subtitle">
              Voces que evalúan talento, innovación e impacto en el Caribe.
            </p>
            <div className="judges__grid">
              {JUDGES.map((judge, i) => (
                <article key={`${judge.name}-${i}`} className="judge">
                  <div className="judge__photo-wrap">
                    {judge.photo ? (
                      <img
                        src={judge.photo}
                        alt={judge.name}
                        className="judge__photo"
                        loading="lazy"
                      />
                    ) : (
                      <div className="judge__photo judge__photo--placeholder" aria-hidden="true">
                        {initials(judge.name)}
                      </div>
                    )}
                    {judge.instagramUrl && (
                      <span className="judge__play" aria-hidden="true">
                        ▶
                      </span>
                    )}
                  </div>
                  <h3 className="judge__name">{judge.name}</h3>
                  <p className="judge__title">{judge.title}</p>
                  {judge.instagramUrl && (
                    <a
                      href={judge.instagramUrl}
                      className="judge__ig"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver en Instagram
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </Ticket>
      </div>
    </section>
  )
}
