import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLiveJuryRound2Ranking } from '../lib/supabase.js'
import {
  JURY_ROUND2_CRITERIA,
  JURY_PORTAL,
  CATEGORIES,
  getLiveRankingCountdown,
  isLiveRankingVisible,
} from '../data/content.js'
import './LiveRound2Results.css'

const POLL_MS = 3000

function labelOf(list, value) {
  return list.find((item) => item.value === value)?.label || value || ''
}

function categoryClass(category) {
  const value = String(category || '').toLowerCase()
  if (value === 'junior' || value === 'prime' || value === 'silver') {
    return `live-r2__badge--${value}`
  }
  return ''
}

function formatScore(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  return Number.isInteger(num) ? String(num) : num.toFixed(1)
}

function avgForCriterion(row, key) {
  return row[`avg_${key}`]
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

export default function LiveRound2Results() {
  const [revealed, setRevealed] = useState(() => isLiveRankingVisible())
  const [countdown, setCountdown] = useState(() => getLiveRankingCountdown())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    const tick = window.setInterval(() => {
      const next = getLiveRankingCountdown()
      setCountdown(next)
      if (next.done) setRevealed(true)
    }, 250)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!revealed) {
      setLoading(false)
      return undefined
    }

    let cancelled = false
    let timer

    async function load() {
      try {
        const data = await fetchLiveJuryRound2Ranking()
        if (cancelled) return
        setRows(data)
        setError('')
        setUpdatedAt(Date.now())
        setSecondsAgo(0)
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'No pudimos cargar el ranking.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    load()
    timer = window.setInterval(load, POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [revealed])

  useEffect(() => {
    if (!updatedAt || !revealed) return undefined
    const tick = window.setInterval(() => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - updatedAt) / 1000)))
    }, 1000)
    return () => window.clearInterval(tick)
  }, [updatedAt, revealed])

  if (!revealed) {
    return (
      <div className="live-r2 live-r2--countdown">
        <header className="live-r2__header">
          <div className="live-r2__header-top">
            <p className="live-r2__eyebrow">{JURY_PORTAL.competitionTitle}</p>
            <Link to="/" className="live-r2__home">
              ← Sitio
            </Link>
          </div>
          <h1 className="live-r2__title">Resultados en vivo · 2ª ronda</h1>
          <p className="live-r2__countdown-lead">
            El ranking se revela el <strong>18 de agosto a las 8:30 a. m.</strong>
          </p>
        </header>

        <div className="live-r2__countdown-stage">
          <div className="live-r2__countdown" aria-live="polite">
            <div className="live-r2__countdown-unit">
              <strong>{pad2(countdown.hours)}</strong>
              <span>Horas</span>
            </div>
            <span className="live-r2__countdown-sep" aria-hidden="true">
              :
            </span>
            <div className="live-r2__countdown-unit">
              <strong>{pad2(countdown.minutes)}</strong>
              <span>Minutos</span>
            </div>
            <span className="live-r2__countdown-sep" aria-hidden="true">
              :
            </span>
            <div className="live-r2__countdown-unit">
              <strong>{pad2(countdown.seconds)}</strong>
              <span>Segundos</span>
            </div>
          </div>

          <div className="live-r2__countdown-art" aria-hidden="true">
            <img
              src="/sharkycolor.png"
              alt=""
              className="live-r2__sharky"
            />
          </div>
        </div>
      </div>
    )
  }

  const top3 = rows.slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="live-r2">
      <header className="live-r2__header">
        <div className="live-r2__header-top">
          <p className="live-r2__eyebrow">{JURY_PORTAL.competitionTitle}</p>
          <Link to="/" className="live-r2__home">
            ← Sitio
          </Link>
        </div>
        <h1 className="live-r2__title">Resultados en vivo · 2ª ronda</h1>
        <p className="live-r2__status" aria-live="polite">
          {loading && !rows.length
            ? 'Cargando ranking…'
            : updatedAt
              ? `Actualizado hace ${secondsAgo}s · se refresca cada 3s`
              : 'Esperando datos…'}
        </p>
        {error ? <p className="live-r2__error">{error}</p> : null}
      </header>

      {!loading && !error && rows.length === 0 ? (
        <p className="live-r2__empty">
          Aún no hay calificaciones. El ranking aparecerá en cuanto los jurados
          guarden sus notas.
        </p>
      ) : null}

      {top3.length > 0 ? (
        <section className="live-r2__podium" aria-label="Top 3">
          {podiumOrder.map((row) => {
            const place = rows.findIndex((r) => r.competitor_id === row.competitor_id) + 1
            return (
              <article
                key={row.competitor_id}
                className={`live-r2__podium-card live-r2__podium-card--${place}`}
              >
                <span className="live-r2__podium-place">{place}°</span>
                {row.logo_url ? (
                  <img
                    className="live-r2__podium-logo"
                    src={row.logo_url}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="live-r2__podium-logo live-r2__podium-logo--fallback" />
                )}
                <h2>{row.venture_name || 'Emprendimiento'}</h2>
                <p className="live-r2__podium-total">
                  {formatScore(row.avg_total)}
                  <span> / 25</span>
                </p>
                <p className="live-r2__podium-votes">
                  {row.jury_count} jurado{row.jury_count === 1 ? '' : 's'}
                </p>
              </article>
            )
          })}
        </section>
      ) : null}

      {rows.length > 0 ? (
        <section className="live-r2__list" aria-label="Ranking completo">
          <ol className="live-r2__ranking">
            {rows.map((row, index) => {
              const cat = String(row.category || '').toLowerCase()
              const catMod = categoryClass(cat)
              return (
                <li key={row.competitor_id} className="live-r2__row">
                  <div className="live-r2__row-main">
                    <span className="live-r2__rank">{index + 1}</span>
                    {row.logo_url ? (
                      <img
                        className="live-r2__logo"
                        src={row.logo_url}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="live-r2__logo live-r2__logo--fallback" />
                    )}
                    <div className="live-r2__identity">
                      <div className="live-r2__name-row">
                        <strong>{row.venture_name || 'Emprendimiento'}</strong>
                        {labelOf(CATEGORIES, row.category) ? (
                          <span
                            className={`live-r2__badge${catMod ? ` ${catMod}` : ''}`}
                          >
                            {labelOf(CATEGORIES, row.category)}
                          </span>
                        ) : null}
                      </div>
                      <span className="live-r2__meta">
                        {row.jury_count} calificación
                        {row.jury_count === 1 ? '' : 'es'}
                      </span>
                    </div>
                    <div className="live-r2__total">
                      <strong>{formatScore(row.avg_total)}</strong>
                      <span>/ 25</span>
                    </div>
                  </div>
                  <div className="live-r2__criteria">
                    {JURY_ROUND2_CRITERIA.map((c) => (
                      <div key={c.key} className="live-r2__criterion">
                        <span>{c.label}</span>
                        <strong>{formatScore(avgForCriterion(row, c.key))}</strong>
                      </div>
                    ))}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}
    </div>
  )
}
