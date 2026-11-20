import { useEffect, useId, useRef, useState } from 'react'
import { AGENDA } from '../data/content.js'
import './Agenda.css'

function PosterModal({ src, title, onClose }) {
  const panelRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [onClose])

  return (
    <div
      className="agenda-modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="agenda-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="agenda-modal__close"
          onClick={onClose}
          aria-label="Cerrar afiche"
        >
          ×
        </button>
        <h2 id={titleId} className="agenda-modal__title">
          {title}
        </h2>
        <img src={src} alt={title} />
      </div>
    </div>
  )
}

export default function Agenda() {
  const [poster, setPoster] = useState(null)

  function openPoster(src, title) {
    setPoster({ src, title })
  }

  return (
    <section id="agenda" className="agenda">
      <div className="container agenda__inner">
        <header className="agenda__header">
          <p className="agenda__eyebrow">Gran Final</p>
          <h2 className="agenda__title">Agenda</h2>
          <p className="agenda__date">{AGENDA.date}</p>
          <p className="agenda__place">{AGENDA.place}</p>
          <p className="agenda__meta">
            <span>{AGENDA.ingress}</span>
            <span>{AGENDA.program}</span>
          </p>
          <button
            type="button"
            className="agenda__poster-btn"
            onClick={() => openPoster(AGENDA.poster, 'Cronograma de la Gran Final')}
          >
            Ver afiche
          </button>
        </header>

        <ol className="agenda__list">
          {AGENDA.items.map((item) => (
            <li key={item.time} className="agenda__item">
              <time className="agenda__time">{item.time}</time>
              <div className="agenda__copy">
                <p className="agenda__item-title">{item.title}</p>
                {item.detail && <p className="agenda__detail">{item.detail}</p>}
              </div>
              {item.poster && (
                <button
                  type="button"
                  className="agenda__link"
                  onClick={() => openPoster(item.poster, item.title)}
                >
                  {item.posterLabel || 'Ver pieza'}
                </button>
              )}
              {item.href && (
                <a className="agenda__link" href={item.href}>
                  {item.linkLabel}
                </a>
              )}
            </li>
          ))}
        </ol>

        <div className="agenda__hosts">
          <h3 className="agenda__hosts-title">Conducen la noche</h3>
          <ul className="agenda__hosts-list">
            {AGENDA.hosts.map((host) => (
              <li key={host.name}>
                <button
                  type="button"
                  className="agenda__host"
                  onClick={() => openPoster(host.poster, host.name)}
                >
                  <img src={host.poster} alt="" />
                  <span className="agenda__host-role">{host.role}</span>
                  <span className="agenda__host-name">{host.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {poster && (
        <PosterModal
          src={poster.src}
          title={poster.title}
          onClose={() => setPoster(null)}
        />
      )}
    </section>
  )
}
