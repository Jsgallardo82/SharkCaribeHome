import { useState } from 'react'
import { NAV_LINKS, INSTAGRAM_URL } from '../data/content.js'
import './Navbar.css'

export default function Navbar({ onRegister }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a href="#inicio" className="navbar__logo">
          <img
            src="/logo shark caribe fondo blanco.jpeg"
            alt="Shark Caribe"
          />
        </a>

        <button
          className="navbar__toggle"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar__nav ${open ? 'is-open' : ''}`}>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="navbar__social"
                aria-label="Instagram de Shark Caribe"
                onClick={() => setOpen(false)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
                </svg>
                <span className="navbar__social-label">Instagram</span>
              </a>
            </li>
            <li>
              <button
                type="button"
                className="btn btn--primary navbar__cta"
                onClick={() => {
                  setOpen(false)
                  onRegister('participante')
                }}
              >
                Inscríbete
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
