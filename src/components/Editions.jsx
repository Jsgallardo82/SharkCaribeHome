import { EDITIONS } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Editions.css'

export default function Editions() {
  return (
    <section id="ediciones" className="section">
      <div className="container">
        <Ticket
          className="ticket--section editions-ticket"
          stub={
            <div className="editions-ticket__stub">
              <span className="editions-ticket__stub-label">Ediciones realizadas</span>
              <Barcode variant="light" className="editions-ticket__barcode" />
            </div>
          }
        >
          <div className="editions-ticket__main">
            <h2 className="section__title">Ediciones anteriores</h2>
            <p className="section__subtitle">
              Un recorrido por la historia de nuestro evento a lo largo de los años.
            </p>
            <div className="editions__grid">
              {EDITIONS.map((edition) => (
                <article key={edition.year} className="edition-card">
                  <div className="edition-card__image">
                    {edition.image ? (
                      <img src={edition.image} alt={`Edición ${edition.year}`} />
                    ) : (
                      <div className="edition-card__placeholder">{edition.year}</div>
                    )}
                  </div>
                  <div className="edition-card__body">
                    <span className="edition-card__year">{edition.year}</span>
                    <h3>{edition.title}</h3>
                    <p>{edition.description}</p>
                    {edition.videoUrl && (
                      <a
                        href={edition.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="edition-card__video"
                      >
                        ▶ Ver transmisión
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Ticket>
      </div>
    </section>
  )
}
