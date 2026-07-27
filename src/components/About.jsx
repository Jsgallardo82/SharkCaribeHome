import { ABOUT } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './About.css'

export default function About() {
  return (
    <section id="quienes-somos" className="section">
      <div className="container">
        <Ticket
          className="ticket--section about-ticket"
          stub={
            <div className="about-ticket__stub">
              {ABOUT.stats.map((stat, i) => (
                <div key={i} className="about-ticket__stat">
                  <span className="about-ticket__stat-value">{stat.value}</span>
                  <span className="about-ticket__stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          }
        >
          <div className="about-ticket__main">
            <Barcode variant="dark" className="about-ticket__barcode" />
            <h2 className="section__title">{ABOUT.title}</h2>
            <div className="about-ticket__text">
              {ABOUT.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </Ticket>
      </div>
    </section>
  )
}
