import { useEffect, useRef } from 'react'
import {
  COMPETITOR_REGISTRATION_CLOSED,
  INSTAGRAM_URL,
} from '../data/content.js'
import './RegisterModal.css'

export default function ClosedCompetitorModal({ onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closed-competitor-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="modal__body modal__success">
          <h2 id="closed-competitor-title">
            {COMPETITOR_REGISTRATION_CLOSED.title}
          </h2>
          <p>{COMPETITOR_REGISTRATION_CLOSED.message}</p>
          <p>
            {COMPETITOR_REGISTRATION_CLOSED.contactHint}{' '}
            <a href={`mailto:${COMPETITOR_REGISTRATION_CLOSED.email}`}>
              {COMPETITOR_REGISTRATION_CLOSED.email}
            </a>
            .
          </p>
          <p>
            También puedes escribirnos por{' '}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            .
          </p>
          <footer className="modal__footer">
            <button type="button" className="btn btn--primary" onClick={onClose}>
              Entendido
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}
