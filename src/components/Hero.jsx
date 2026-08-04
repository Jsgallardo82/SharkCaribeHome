import { useEffect, useRef, useState } from 'react'
import { HERO_SLIDES } from '../data/content.js'
import './Hero.css'

const REGISTER_OPTIONS = [
  { id: 'participante', label: 'Participante' },
  { id: 'asistente', label: 'Asistente' },
  { id: 'patrocinador', label: 'Patrocinador' },
]

export default function Hero({ onRegister }) {
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const count = HERO_SLIDES.length

  useEffect(() => {
    if (count <= 1 || menuOpen) return undefined
    const id = setInterval(() => setActive((a) => (a + 1) % count), 6000)
    return () => clearInterval(id)
  }, [count, menuOpen])

  useEffect(() => {
    if (!menuOpen) return undefined

    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const go = (i) => setActive((i + count) % count)

  const choose = (kind) => {
    setMenuOpen(false)
    onRegister?.(kind)
  }

  return (
    <section id="inicio" className="hero" aria-roledescription="carrusel">
      <div
        className="hero__bg"
        style={{ backgroundImage: 'url("/album/2023/Imagen9.jpg")' }}
        aria-hidden="true"
      />
      <div className="hero__overlay" aria-hidden="true" />

      <div className="hero__track">
        {HERO_SLIDES.map((slide, i) => (
          <figure
            key={slide.id}
            className={`hero__slide ${i === active ? 'is-active' : ''}`}
            aria-hidden={i !== active}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="hero__image"
              draggable={false}
            />
          </figure>
        ))}
      </div>

      <div className="hero__register" ref={menuRef}>
        {menuOpen && (
          <div className="hero__register-menu" role="menu">
            {REGISTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                className="hero__register-option"
                onClick={() => choose(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn hero__register-btn"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Inscríbete
          <span className="hero__register-caret" aria-hidden="true">
            {menuOpen ? '▴' : '▾'}
          </span>
        </button>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="hero__nav hero__nav--prev"
            onClick={() => go(active - 1)}
            aria-label="Imagen anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero__nav hero__nav--next"
            onClick={() => go(active + 1)}
            aria-label="Imagen siguiente"
          >
            ›
          </button>
          <div className="hero__dots" role="tablist" aria-label="Diapositivas del hero">
            {HERO_SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`hero__dot ${i === active ? 'is-active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Ir a imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
