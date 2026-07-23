import { ABOUT } from '../data/content.js'
import './About.css'

export default function About() {
  return (
    <section id="quienes-somos" className="section">
      <div className="container">
        <h2 className="section__title">{ABOUT.title}</h2>
        <div className="about__grid">
          <div className="about__text">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="about__stats">
            {ABOUT.stats.map((stat, i) => (
              <div key={i} className="about__stat">
                <span className="about__stat-value">{stat.value}</span>
                <span className="about__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
