import { NAV_LINKS, INSTAGRAM_URL } from '../data/content.js'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <a href="#inicio" className="footer__logo">
          Shark<span>Caribe</span>
        </a>
        <nav className="footer__nav">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={INSTAGRAM_URL}
          className="footer__social"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram de Shark Caribe"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
          </svg>
          <span>@shark.caribe</span>
        </a>

        <div className="footer__legal">
          <img
            className="footer__legal-mascot"
            src="/sharky.png"
            alt="Sharky, mascota de Shark Caribe"
            width="88"
            height="88"
          />
          <p className="footer__legal-text">
            Shark Caribe® es una marca registrada ante la Superintendencia de
            Industria y Comercio. Su uso no autorizado, reproducción parcial o
            total, así como la imitación de sus elementos distintivos, constituye
            una infracción a la legislación vigente en materia de propiedad
            industrial. Shark Caribe® Pitch Competition es operado
            exclusivamente por IS Comunicaciones.
          </p>
        </div>

        <p className="footer__copy">
          © {new Date().getFullYear()} Shark Caribe. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
