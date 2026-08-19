import { useEffect, useMemo, useRef, useState } from 'react'
import { INSTAGRAM_FEED } from '../data/content.js'
import { loadAndProcessInstagramEmbeds } from '../lib/instagramEmbed.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './InstagramFeed.css'

const MAX_VISIBLE = INSTAGRAM_FEED.maxVisible || 12

/** @param {string} url */
function normalizePostUrl(url = '') {
  try {
    const parsed = new URL(url)
    parsed.search = ''
    parsed.hash = ''
    let path = parsed.pathname
    if (!path.endsWith('/')) path += '/'
    return `${parsed.origin}${path}`
  } catch {
    return String(url).split('?')[0].split('#')[0]
  }
}

function getPerView() {
  if (typeof window === 'undefined') return 1
  if (window.matchMedia('(min-width: 1100px)').matches) return 3
  if (window.matchMedia('(min-width: 720px)').matches) return 2
  return 1
}

function InstagramIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="28"
      height="28"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  )
}

export default function InstagramFeed() {
  const sectionRef = useRef(null)
  const touchStartX = useRef(null)
  const [visible, setVisible] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  const [scriptError, setScriptError] = useState('')
  const [perView, setPerView] = useState(1)
  const [page, setPage] = useState(0)

  const sortedPosts = useMemo(() => {
    const list = Array.isArray(INSTAGRAM_FEED.posts) ? [...INSTAGRAM_FEED.posts] : []
    return list
      .filter((p) => p?.post_url)
      .sort((a, b) => (b.display_order ?? 0) - (a.display_order ?? 0))
  }, [])

  const visiblePosts = sortedPosts.slice(0, MAX_VISIBLE)
  const hasMore = sortedPosts.length > MAX_VISIBLE
  const isEmpty = visiblePosts.length === 0
  const count = visiblePosts.length
  const pageCount = Math.max(1, Math.ceil(count / perView) || 1)
  const safePage = Math.min(page, pageCount - 1)
  const showLoading = !isEmpty && !scriptReady && !scriptError
  const profileUrl = INSTAGRAM_FEED.profileUrl
  const profileHandle = `@${INSTAGRAM_FEED.username}`

  const goPrev = () => {
    setPage((p) => (p - 1 + pageCount) % pageCount)
  }

  const goNext = () => {
    setPage((p) => (p + 1) % pageCount)
  }

  useEffect(() => {
    const sync = () => {
      const next = getPerView()
      setPerView(next)
      setPage((p) => {
        const max = Math.max(0, Math.ceil(count / next) - 1)
        return Math.min(p, max)
      })
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [count])

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isEmpty) {
      setScriptReady(true)
      setScriptError('')
      return undefined
    }

    let cancelled = false
    setScriptReady(false)
    setScriptError('')

    loadAndProcessInstagramEmbeds(300)
      .then(() => {
        if (!cancelled) setScriptReady(true)
      })
      .catch((err) => {
        if (!cancelled) {
          setScriptError(err?.message || 'No pudimos cargar Instagram.')
          setScriptReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isEmpty, count])

  /* Re-procesar al cambiar de página (widgets que entran en viewport) */
  useEffect(() => {
    if (isEmpty) return undefined
    loadAndProcessInstagramEmbeds(200).catch(() => {})
  }, [safePage, isEmpty])

  useEffect(() => {
    if (isEmpty || pageCount <= 1) return undefined

    function onKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        setPage((p) => (p - 1 + pageCount) % pageCount)
      }
      if (e.key === 'ArrowRight') {
        setPage((p) => (p + 1) % pageCount)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isEmpty, pageCount])

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current == null || pageCount <= 1) return
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta > 0) goPrev()
    else goNext()
  }

  return (
    <section
      id="instagram"
      ref={sectionRef}
      className={`ig-feed section ${visible ? 'is-visible' : ''}`}
      aria-label={`Publicaciones oficiales de Instagram · ${INSTAGRAM_FEED.eyebrow}`}
    >
      <div className="container ig-feed__inner">
        <header className="ig-feed__header">
          <p className="ig-feed__eyebrow">{INSTAGRAM_FEED.eyebrow}</p>
          <h2 className="ig-feed__title">{INSTAGRAM_FEED.title}</h2>
          <p className="ig-feed__subtitle">{INSTAGRAM_FEED.subtitle}</p>
          <a
            className="ig-feed__handle"
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Perfil de Instagram ${profileHandle}`}
          >
            <InstagramIcon />
            {profileHandle}
          </a>
        </header>

        {isEmpty ? (
          <div className="ig-feed__empty">
            <InstagramIcon className="ig-feed__empty-icon" />
            <p>{INSTAGRAM_FEED.emptyMessage}</p>
            <a
              className="ig-feed__cta"
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Seguir {profileHandle}
            </a>
          </div>
        ) : (
          <>
            <div
              className="ig-feed__carousel"
              data-per-view={perView}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {pageCount > 1 ? (
                <button
                  type="button"
                  className="ig-feed__nav ig-feed__nav--prev"
                  onClick={goPrev}
                  aria-label="Anterior"
                >
                  ‹
                </button>
              ) : null}

              <div className="ig-feed__viewport">
                {showLoading ? (
                  <div className="ig-feed__loading" role="status" aria-live="polite">
                    <span className="ig-feed__spinner" aria-hidden="true" />
                    <p>Cargando publicaciones...</p>
                  </div>
                ) : null}

                <div
                  className="ig-feed__track"
                  style={{
                    '--per-view': perView,
                    '--page': safePage,
                  }}
                >
                  {visiblePosts.map((post, index) => {
                    const permalink = normalizePostUrl(post.post_url)
                    return (
                      <article
                        key={post.id || permalink}
                        className="ig-feed__slide"
                        style={{ '--ig-i': index }}
                        aria-label={`Publicación ${index + 1} de ${count}`}
                      >
                        <Ticket
                          className="ig-feed__ticket"
                          notchBg="var(--color-bg-alt)"
                          stub={
                            <div className="ig-feed__ticket-stub">
                              <span className="ig-feed__ticket-label">
                                @{INSTAGRAM_FEED.username}
                              </span>
                              <Barcode
                                variant="light"
                                className="ig-feed__ticket-barcode"
                              />
                            </div>
                          }
                        >
                          <div className="ig-feed__ticket-main">
                            <blockquote
                              className="instagram-media"
                              data-instgrm-permalink={permalink}
                              data-instgrm-version="14"
                              style={{
                                background: '#FFF',
                                border: 0,
                                borderRadius: 3,
                                boxShadow: 'none',
                                margin: 0,
                                maxWidth: '100%',
                                minWidth: 0,
                                padding: 0,
                                width: '100%',
                              }}
                            >
                              <div style={{ padding: 12 }}>
                                <a
                                  href={permalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Ver esta publicación en Instagram
                                </a>
                              </div>
                            </blockquote>
                          </div>
                        </Ticket>
                      </article>
                    )
                  })}
                </div>
              </div>

              {pageCount > 1 ? (
                <button
                  type="button"
                  className="ig-feed__nav ig-feed__nav--next"
                  onClick={goNext}
                  aria-label="Siguiente"
                >
                  ›
                </button>
              ) : null}
            </div>

            {pageCount > 1 ? (
              <div className="ig-feed__controls">
                <p className="ig-feed__counter" aria-live="polite">
                  {safePage + 1} / {pageCount}
                </p>
                <div className="ig-feed__dots" role="tablist" aria-label="Páginas">
                  {Array.from({ length: pageCount }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === safePage}
                      aria-label={`Ir a página ${i + 1}`}
                      className={`ig-feed__dot${i === safePage ? ' is-active' : ''}`}
                      onClick={() => setPage(i)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {scriptError ? (
              <p className="ig-feed__error" role="alert">
                {scriptError} Puedes abrir las publicaciones en Instagram.
              </p>
            ) : null}

            {(hasMore || visiblePosts.length > 0) && (
              <div className="ig-feed__footer">
                <a
                  className="ig-feed__cta"
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {INSTAGRAM_FEED.moreCta}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
