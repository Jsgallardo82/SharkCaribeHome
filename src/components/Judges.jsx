import { useEffect, useRef, useState } from 'react'
import { JUDGES } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Judges.css'

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

/* Convierte un link de reel/post de IG a la URL de embed oficial. */
function instagramEmbedSrc(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '')
    if (
      !path.includes('/reel/') &&
      !path.includes('/p/') &&
      !path.includes('/tv/')
    ) {
      return null
    }
    return `https://www.instagram.com${path}/embed`
  } catch {
    return null
  }
}

function InstagramModal({ judge, onClose }) {
  const panelRef = useRef(null)
  const embedSrc = instagramEmbedSrc(judge.instagramUrl)

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
      className="judge-modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="judge-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="judge-modal-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="judge-modal__close"
          onClick={onClose}
          aria-label="Cerrar video"
        >
          ×
        </button>

        <header className="judge-modal__header">
          <h2 id="judge-modal-title">{judge.name}</h2>
          {judge.title && <p>{judge.title}</p>}
        </header>

        <div className="judge-modal__embed-wrap">
          {embedSrc ? (
            <iframe
              className="judge-modal__embed"
              src={embedSrc}
              title={`Video de Instagram · ${judge.name}`}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <p className="judge-modal__fallback-text">
              No pudimos incrustar este video. Ábrelo en Instagram.
            </p>
          )}
        </div>

        <a
          href={judge.instagramUrl}
          className="judge-modal__ig-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir en Instagram
        </a>
      </div>
    </div>
  )
}

export default function Judges() {
  const [activeJudge, setActiveJudge] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const gridRef = useRef(null)

  useEffect(() => {
    const node = gridRef.current
    if (!node) return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduceMotion.matches) {
      setRevealed(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="jurados" className="judges">
      <div className="judges__glow" aria-hidden="true" />
      <div className="container judges__inner">
        <Ticket
          className="ticket--section judges-ticket"
          notchBg="#070d22"
          stub={
            <div className="judges-ticket__stub">
              <span className="judges-ticket__stub-label">El jurado</span>
              <Barcode variant="light" className="judges-ticket__barcode" />
            </div>
          }
        >
          <div className="judges-ticket__main">
            <h2 className="judges-ticket__title">Jurados</h2>
            <div
              ref={gridRef}
              className={`judges__grid ${revealed ? 'is-revealed' : ''}`}
            >
              {JUDGES.map((judge, i) => {
                const photo = judge.photo ? (
                  <img
                    src={judge.photo}
                    alt={judge.name}
                    className="judge__photo"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="judge__photo judge__photo--placeholder"
                    aria-hidden="true"
                  >
                    {initials(judge.name)}
                  </div>
                )

                return (
                  <article
                    key={`${judge.name}-${i}`}
                    className="judge"
                    style={{ '--judge-delay': `${i * 120}ms` }}
                  >
                    <div className="judge__photo-wrap">
                      {judge.instagramUrl ? (
                        <button
                          type="button"
                          className="judge__photo-link"
                          onClick={() => setActiveJudge(judge)}
                          aria-label={`Ver video de ${judge.name}`}
                        >
                          {photo}
                          <span className="judge__play" aria-hidden="true">
                            ▶
                          </span>
                        </button>
                      ) : (
                        photo
                      )}
                    </div>
                    {judge.title && (
                      <p className="judge__title">{judge.title}</p>
                    )}
                    {judge.instagramUrl && (
                      <button
                        type="button"
                        className="judge__ig"
                        onClick={() => setActiveJudge(judge)}
                      >
                        Ver video
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
            <p className="judges-ticket__closing">
              Voces que evaluarán el talento, innovación e impacto de los
              competidores
            </p>
          </div>
        </Ticket>
      </div>

      {activeJudge && (
        <InstagramModal
          judge={activeJudge}
          onClose={() => setActiveJudge(null)}
        />
      )}
    </section>
  )
}
