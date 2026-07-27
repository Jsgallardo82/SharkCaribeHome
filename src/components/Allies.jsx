import { ORGANIZER, ALLIES } from '../data/content.js'
import './Allies.css'

export default function Allies() {
  return (
    <section className="allies">
      <div className="allies__perf" aria-hidden="true" />
      <div className="container allies__inner">
        <div className="allies__block">
          <p className="allies__label">Organiza</p>
          {ORGANIZER.logo ? (
            <img
              src={ORGANIZER.logo}
              alt={ORGANIZER.name}
              className="allies__organizer-logo"
            />
          ) : (
            <div className="allies__slot allies__slot--organizer">logo</div>
          )}
        </div>

        <div className="allies__block">
          <p className="allies__label">Aliados estratégicos</p>
          <ul className="allies__list">
            {ALLIES.map((ally, i) => (
              <li key={i} className="allies__item">
                {ally.logo ? (
                  <img src={ally.logo} alt={ally.name} className="allies__logo" />
                ) : (
                  <div className="allies__slot">logo</div>
                )}
                <span className="allies__name">{ally.name}</span>
                {ally.sub && <span className="allies__sub">{ally.sub}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
