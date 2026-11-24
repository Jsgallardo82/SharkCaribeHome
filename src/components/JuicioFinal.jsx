import { useEffect, useMemo, useState } from 'react'
import {
  fetchJuryFinalCompetitors,
  fetchMyJuryScoresFinal,
  upsertJuryScoreFinal,
} from '../lib/supabase.js'
import {
  JURY_FINAL_CRITERIA,
  JURY_FINAL_SCORE_MAX,
  JURY_FINAL_SCORE_MIN,
  JURY_FINAL_TOTAL,
  juryFinalCriterionPoints,
  CATEGORIES,
  SECTORS,
  resolveCompetitorPhotos,
} from '../data/content.js'
import './Juicio2Ronda.css'

const SCORE_OPTIONS = Array.from(
  { length: JURY_FINAL_SCORE_MAX - JURY_FINAL_SCORE_MIN + 1 },
  (_, i) => JURY_FINAL_SCORE_MIN + i
)

function emptyScores() {
  return JURY_FINAL_CRITERIA.reduce((acc, c) => {
    acc[c.key] = ''
    return acc
  }, {})
}

function formatPoints(value) {
  if (value == null) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function labelOf(list, value) {
  return list.find((item) => item.value === value)?.label || value || ''
}

function categoryClass(category) {
  const value = String(category || '').toLowerCase()
  if (value === 'junior' || value === 'prime' || value === 'silver') {
    return `juicio2__badge--${value}`
  }
  return ''
}

function CategoryBadge({ category }) {
  const label = labelOf(CATEGORIES, category)
  if (!label) return null
  const mod = categoryClass(category)
  return (
    <span className={`juicio2__badge juicio2__badge--category${mod ? ` ${mod}` : ''}`}>
      {label}
    </span>
  )
}

function SectorBadge({ sector }) {
  const label = labelOf(SECTORS, sector)
  if (!label) return null
  return <span className="juicio2__badge juicio2__badge--sector">{label}</span>
}

function scoresFromRow(row) {
  if (!row) return emptyScores()
  return JURY_FINAL_CRITERIA.reduce((acc, c) => {
    acc[c.key] = String(row[c.key] ?? '')
    return acc
  }, {})
}

export default function JuicioFinal() {
  const [competitors, setCompetitors] = useState([])
  const [scoresByCompetitor, setScoresByCompetitor] = useState({})
  const [selectedId, setSelectedId] = useState('')
  const [formScores, setFormScores] = useState(emptyScores)
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [list, mine] = await Promise.all([
          fetchJuryFinalCompetitors(),
          fetchMyJuryScoresFinal(),
        ])
        if (cancelled) return

        const map = {}
        for (const row of mine) map[row.competitor_id] = row

        setCompetitors(list)
        setScoresByCompetitor(map)
        if (list.length && !selectedId) {
          setSelectedId(list[0].id)
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'No pudimos cargar el juicio.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const existing = scoresByCompetitor[selectedId]
    setFormScores(scoresFromRow(existing))
    setObservaciones(existing?.observaciones || '')
  }, [selectedId, scoresByCompetitor])

  useEffect(() => {
    setOkMsg('')
    setError('')
  }, [selectedId])

  const selected = useMemo(
    () => competitors.find((c) => c.id === selectedId) || null,
    [competitors, selectedId]
  )

  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1
    return competitors.findIndex((c) => c.id === selectedId)
  }, [competitors, selectedId])

  const selectedPhotos = useMemo(
    () => (selected ? resolveCompetitorPhotos(selected.venture_name) : []),
    [selected]
  )

  const liveTotal = useMemo(() => {
    let sum = 0
    let complete = true
    for (const c of JURY_FINAL_CRITERIA) {
      const points = juryFinalCriterionPoints(formScores[c.key], c.weight)
      if (points == null) {
        complete = false
        continue
      }
      sum += points
    }
    return { sum, complete }
  }, [formScores])

  const handleScoreChange = (key, value) => {
    setFormScores((prev) => ({ ...prev, [key]: value }))
    setOkMsg('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedId) return

    for (const c of JURY_FINAL_CRITERIA) {
      if (juryFinalCriterionPoints(formScores[c.key], c.weight) == null) {
        setError(`Completa el criterio “${c.label}” con un valor entre 1 y 5.`)
        return
      }
    }

    setSaving(true)
    setError('')
    setOkMsg('')
    try {
      const saved = await upsertJuryScoreFinal({
        competitorId: selectedId,
        ...Object.fromEntries(
          JURY_FINAL_CRITERIA.map((c) => [c.key, Number(formScores[c.key])])
        ),
        observaciones,
      })
      setScoresByCompetitor((prev) => ({ ...prev, [selectedId]: saved }))
      setOkMsg('Calificación guardada correctamente.')
      requestAnimationFrame(() => {
        document.getElementById('juicio-final-save-feedback')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      })
    } catch (err) {
      setError(err?.message || 'No pudimos guardar la calificación.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="juicio2__status">Cargando finalistas…</p>
  }

  if (!competitors.length) {
    return (
      <div className="juicio2">
        <header className="juicio2__header">
          <h2>Juicio · Fogueo</h2>
          <p>Aún no hay concursantes en etapa “Final”.</p>
        </header>
        {error ? <p className="juicio2__error">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="juicio2">
      <header className="juicio2__header">
        <h2>Juicio · Fogueo</h2>
        <p>
          Califica cada criterio de 1 a 5 al cierre del fogueo. Los puntos son
          nota ÷ 5 × peso. El total es sobre 100.
        </p>
      </header>

      <div className="juicio2__layout">
        <aside className="juicio2__list" aria-label="Finalistas">
          {competitors.map((c, index) => {
            const scored = Boolean(scoresByCompetitor[c.id])
            const active = c.id === selectedId
            const number = index + 1
            return (
              <button
                key={c.id}
                type="button"
                className={`juicio2__item${active ? ' is-active' : ''}${
                  scored ? ' is-scored' : ''
                }`}
                onClick={() => setSelectedId(c.id)}
              >
                <span className="juicio2__item-num" aria-hidden="true">
                  {number}
                </span>
                <span className="juicio2__item-body">
                  <span className="juicio2__item-name">
                    {c.venture_name || 'Sin nombre'}
                  </span>
                  <span className="juicio2__item-badges">
                    <CategoryBadge category={c.category} />
                    <SectorBadge sector={c.sector} />
                  </span>
                  <span className="juicio2__item-meta">
                    {scored
                      ? `Total ${scoresByCompetitor[c.id].total}/${JURY_FINAL_TOTAL}`
                      : 'Sin calificar'}
                  </span>
                </span>
              </button>
            )
          })}
        </aside>

        <section className="juicio2__panel">
          {selected ? (
            <>
              <div className="juicio2__venture">
                <div className="juicio2__logo-wrap">
                  {selected.logo_url ? (
                    <img
                      className="juicio2__logo"
                      src={selected.logo_url}
                      alt={`Logo de ${selected.venture_name}`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="juicio2__logo-fallback" aria-hidden="true">
                      {(selected.venture_name || '?').slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="juicio2__venture-copy">
                  <h3>
                    {selectedIndex >= 0 ? (
                      <span className="juicio2__venture-num">{selectedIndex + 1}</span>
                    ) : null}
                    {selected.venture_name}
                  </h3>
                  {selected.full_name ? (
                    <p className="juicio2__person">{selected.full_name}</p>
                  ) : null}
                  <div className="juicio2__venture-badges">
                    <CategoryBadge category={selected.category} />
                    <SectorBadge sector={selected.sector} />
                  </div>
                </div>
                {selectedPhotos.length > 0 ? (
                  <div
                    className={`juicio2__photos${
                      selectedPhotos.length > 1 ? ' juicio2__photos--multi' : ''
                    }`}
                  >
                    {selectedPhotos.map((src) => (
                      <div key={src} className="juicio2__photo">
                        <img
                          src={encodeURI(src)}
                          alt={`Foto de ${selected.venture_name}`}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <form className="juicio2__form" onSubmit={handleSubmit} noValidate>
                {JURY_FINAL_CRITERIA.map((criterion) => {
                  const points = juryFinalCriterionPoints(
                    formScores[criterion.key],
                    criterion.weight
                  )
                  return (
                    <fieldset key={criterion.key} className="juicio2__criterion">
                      <legend>
                        {criterion.label}
                        <span className="juicio2__weight"> · peso {criterion.weight}</span>
                      </legend>
                      <p className="juicio2__hint">{criterion.hint}</p>
                      <div className="juicio2__scores" role="radiogroup">
                        {SCORE_OPTIONS.map((n) => {
                          const id = `final-${criterion.key}-${n}`
                          return (
                            <label key={n} className="juicio2__score" htmlFor={id}>
                              <input
                                id={id}
                                type="radio"
                                name={criterion.key}
                                value={n}
                                checked={String(formScores[criterion.key]) === String(n)}
                                onChange={() => handleScoreChange(criterion.key, String(n))}
                              />
                              <span>{n}</span>
                            </label>
                          )
                        })}
                      </div>
                      <p className="juicio2__criterion-points">
                        {points == null
                          ? `— / ${criterion.weight}`
                          : `${formatPoints(points)} / ${criterion.weight}`}
                      </p>
                    </fieldset>
                  )
                })}

                <div className="juicio2__total">
                  <span>Puntaje de fogueo</span>
                  <strong>
                    {liveTotal.complete
                      ? `${formatPoints(liveTotal.sum)} / ${JURY_FINAL_TOTAL}`
                      : `— / ${JURY_FINAL_TOTAL}`}
                  </strong>
                </div>

                <label className="juicio2__notes">
                  <span>Observaciones (opcional)</span>
                  <textarea
                    rows={4}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Comentarios del jurado…"
                  />
                </label>

                {error ? (
                  <p className="juicio2__error" role="alert">
                    {error}
                  </p>
                ) : null}
                {okMsg ? (
                  <p
                    id="juicio-final-save-feedback"
                    className="juicio2__ok"
                    role="status"
                    aria-live="polite"
                  >
                    {okMsg}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="btn btn--primary juicio2__submit"
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar calificación'}
                </button>
              </form>
            </>
          ) : null}
        </section>
      </div>
    </div>
  )
}
