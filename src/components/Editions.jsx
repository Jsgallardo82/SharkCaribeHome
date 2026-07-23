import { EDITIONS } from '../data/content.js'
import './Editions.css'

export default function Editions() {
  return (
    <section id="ediciones" className="section section--alt">
      <div className="container">
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
