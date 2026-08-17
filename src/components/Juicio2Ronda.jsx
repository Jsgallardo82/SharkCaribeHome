import { useEffect, useMemo, useState } from 'react'
import {
  fetchJuryRound2Competitors,
  fetchMyJuryScoresRound2,
  upsertJuryScoreRound2,
} from '../lib/supabase.js'
import {
  JURY_ROUND2_CRITERIA,
  JURY_ROUND2_SCORE_MAX,
  JURY_ROUND2_SCORE_MIN,
  CATEGORIES,
  SECTORS,
} from '../data/content.js'
import './Juicio2Ronda.css'

const SCORE_OPTIONS = Array.from(
  { length: JURY_ROUND2_SCORE_MAX - JURY_ROUND2_SCORE_MIN + 1 },
  (_, i) => JURY_ROUND2_SCORE_MIN + i
)

function emptyScores() {
  return JURY_ROUND2_CRITERIA.reduce((acc, c) => {
    acc[c.key] = ''
    return acc
  }, {})
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
  return JURY_ROUND2_CRITERIA.reduce((acc, c) => {
    acc[c.key] = String(row[c.key] ?? '')
    return acc
  }, {})
}

export default function Juicio2Ronda() {
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
          fetchJuryRound2Competitors(),
          fetchMyJuryScoresRound2(),
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
    setOkMsg('')
    setError('')
  }, [selectedId, scoresByCompetitor])

  const selected = useMemo(
    () => competitors.find((c) => c.id === selectedId) || null,
    [competitors, selectedId]
  )

  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1
    return competitors.findIndex((c) => c.id === selectedId)
  }, [competitors, selectedId])

  const liveTotal = useMemo(() => {
    let sum = 0
    let complete = true
    for (const c of JURY_ROUND2_CRITERIA) {
      const n = Number(formScores[c.key])
      if (!Number.isFinite(n) || n < JURY_ROUND2_SCORE_MIN || n > JURY_ROUND2_SCORE_MAX) {
        complete = false
        continue
      }
      sum += n
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

    for (const c of JURY_ROUND2_CRITERIA) {
      const n = Number(formScores[c.key])
      if (!Number.isFinite(n) || n < JURY_ROUND2_SCORE_MIN || n > JURY_ROUND2_SCORE_MAX) {
        setError(`Completa el criterio “${c.label}” con un valor entre 1 y 5.`)
        return
      }
    }

    setSaving(true)
    setError('')
    setOkMsg('')
    try {
      const saved = await upsertJuryScoreRound2({
        competitorId: selectedId,
        ...Object.fromEntries(
          JURY_ROUND2_CRITERIA.map((c) => [c.key, Number(formScores[c.key])])
        ),
        observaciones,
      })
      setScoresByCompetitor((prev) => ({ ...prev, [selectedId]: saved }))
      setOkMsg('Calificación guardada.')
    } catch (err) {
      setError(err?.message || 'No pudimos guardar la calificación.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="juicio2__status">Cargando concursantes de 2ª ronda…</p>
  }

  if (!competitors.length) {
    return (
      <div className="juicio2">
        <header className="juicio2__header">
          <h2>Juicio · 2ª ronda</h2>
          <p>Aún no hay concursantes en etapa “Segunda vuelta”.</p>
        </header>
        {error ? <p className="juicio2__error">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="juicio2">
      <header className="juicio2__header">
        <h2>Juicio · 2ª ronda</h2>
        <p>Califica cada criterio de 1 a 5. El total se calcula automáticamente.</p>
      </header>

      <div className="juicio2__layout">
        <aside className="juicio2__list" aria-label="Concursantes">
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
                      ? `Total ${scoresByCompetitor[c.id].total}/25`
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
                {selected.logo_url ? (
                  <img
                    className="juicio2__logo"
                    src={selected.logo_url}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
                <div>
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
              </div>

              <form className="juicio2__form" onSubmit={handleSubmit} noValidate>
                {JURY_ROUND2_CRITERIA.map((criterion) => (
                  <fieldset key={criterion.key} className="juicio2__criterion">
                    <legend>{criterion.label}</legend>
                    <p className="juicio2__hint">{criterion.hint}</p>
                    <div className="juicio2__scores" role="radiogroup">
                      {SCORE_OPTIONS.map((n) => {
                        const id = `${criterion.key}-${n}`
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
                  </fieldset>
                ))}

                <div className="juicio2__total">
                  <span>Total</span>
                  <strong>
                    {liveTotal.complete ? `${liveTotal.sum} / 25` : '— / 25'}
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

                {error ? <p className="juicio2__error">{error}</p> : null}
                {okMsg ? <p className="juicio2__ok">{okMsg}</p> : null}

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
