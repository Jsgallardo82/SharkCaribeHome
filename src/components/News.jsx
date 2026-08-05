import { NEWS } from '../data/content.js'
import './News.css'

export default function News() {
  return (
    <section id="novedades" className="news">
      <div
        className="news__bg"
        style={{ backgroundImage: `url("${NEWS.background}")` }}
        aria-hidden="true"
      />
      <div className="news__overlay" aria-hidden="true" />

      <div className="container news__inner">
        <div className="news__heading">
          <span className="news__heading-rule" aria-hidden="true" />
          <h2 className="news__title">
            <span className="news__title-solid">{NEWS.titleSolid}</span>
            <img
              className="news__title-logo"
              src={NEWS.logo}
              alt="Shark Caribe"
            />
          </h2>
          {NEWS.subtitle && <p className="news__subtitle">{NEWS.subtitle}</p>}
        </div>

        <div className="news__grid">
          {NEWS.items
            .filter(
              (item) =>
                item.href &&
                item.href !== '#' &&
                !String(item.title).toLowerCase().includes('próximamente')
            )
            .map((item) => (
              <article key={item.href} className="news-card">
                <div className="news-card__media">
                  <img src={item.image} alt="" loading="lazy" />
                </div>
                <div className="news-card__body">
                  <h3 className="news-card__title">{item.title}</h3>
                  <p className="news-card__excerpt">{item.excerpt}</p>
                  <a
                    className="news-card__cta"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{item.cta || 'Leer más'}</span>
                    <span className="news-card__cta-icon" aria-hidden="true">
                      →
                    </span>
                  </a>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  )
}
