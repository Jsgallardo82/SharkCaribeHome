import { useEffect, useRef, useState } from 'react'
import { GALLERY, INSTAGRAM_URL } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Gallery.css'

const PHOTOS = GALLERY.filter((p) => p.src)

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState(null)
  const touchStartX = useRef(null)
  const isOpen = activeIndex != null
  const activePhoto = isOpen ? PHOTOS[activeIndex] : null

  const openAt = (index) => setActiveIndex(index)
  const close = () => setActiveIndex(null)

  const goPrev = () => {
    setActiveIndex((i) => (i == null ? i : (i - 1 + PHOTOS.length) % PHOTOS.length))
  }

  const goNext = () => {
    setActiveIndex((i) => (i == null ? i : (i + 1) % PHOTOS.length))
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta > 0) goPrev()
    else goNext()
  }

  return (
    <section id="galeria" className="section">
      <div className="container">
        <Ticket
          className="ticket--section gallery-ticket"
          stub={
            <div className="gallery-ticket__stub">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="gallery-ticket__ig"
              >
                @shark.caribe
              </a>
              <Barcode variant="light" className="gallery-ticket__barcode" />
            </div>
          }
        >
          <div className="gallery-ticket__main">
            <h2 className="section__title">Galería · Ediciones anteriores</h2>
            <p className="section__subtitle">
              Momentos de ediciones pasadas de Shark Caribe.
            </p>
            <div className="gallery__grid">
              {PHOTOS.map((photo, i) => (
                <button
                  key={photo.src}
                  type="button"
                  className="gallery__item"
                  onClick={() => openAt(i)}
                  aria-label={`Ver foto: ${photo.alt}`}
                >
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </Ticket>
      </div>

      {isOpen && activePhoto && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Carrusel de galería"
          onClick={close}
        >
          <button
            type="button"
            className="gallery-lightbox__close"
            onClick={close}
            aria-label="Cerrar"
          >
            ×
          </button>

          <button
            type="button"
            className="gallery-lightbox__nav gallery-lightbox__nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            aria-label="Foto anterior"
          >
            ‹
          </button>

          <div
            className="gallery-lightbox__stage"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              key={activePhoto.src}
              src={activePhoto.src}
              alt={activePhoto.alt}
              className="gallery-lightbox__img"
            />
            <p className="gallery-lightbox__meta">
              {activePhoto.alt} · {activeIndex + 1} / {PHOTOS.length}
            </p>
          </div>

          <button
            type="button"
            className="gallery-lightbox__nav gallery-lightbox__nav--next"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            aria-label="Foto siguiente"
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}
