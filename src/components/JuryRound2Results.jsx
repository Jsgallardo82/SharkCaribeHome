import { Fragment, useEffect, useMemo, useState } from 'react'
import { fetchAllJuryScoresRound2 } from '../lib/supabase.js'
import { JURY_ROUND2_CRITERIA, CATEGORIES, SECTORS } from '../data/content.js'
import './JuryRound2Results.css'

function labelOf(list, value) {
  return list.find((item) => item.value === value)?.label || value || ''
}

function aggregateByCompetitor(rows) {
  const map = new Map()

  for (const row of rows) {
    const id = row.competitor_id
    if (!map.has(id)) {
      map.set(id, {
        competitorId: id,
        ventureName: row.competitor?.venture_name || 'Emprendimiento',
        fullName: row.competitor?.full_name || '',
        category: row.competitor?.category || '',
        sector: row.competitor?.sector || '',
        scores: [],
      })
    }
    map.get(id).scores.push(row)
  }

  return Array.from(map.values())
    .map((entry) => {
      const n = entry.scores.length
      const sumTotal = entry.scores.reduce((acc, s) => acc + Number(s.total || 0), 0)
      const avgTotal = n ? sumTotal / n : 0
      const avgByCriterion = JURY_ROUND2_CRITERIA.reduce((acc, c) => {
        const sum = entry.scores.reduce((a, s) => a + Number(s[c.key] || 0), 0)
        acc[c.key] = n ? sum / n : 0
        return acc
      }, {})
      return {
        ...entry,
        juryCount: n,
        sumTotal,
        avgTotal,
        avgByCriterion,
      }
    })
    .sort((a, b) => b.avgTotal - a.avgTotal || a.ventureName.localeCompare(b.ventureName))
}

export default function JuryRound2Results() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAllJuryScoresRound2()
        if (!cancelled) setRows(data)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'No pudimos cargar los resultados.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const aggregated = useMemo(() => aggregateByCompetitor(rows), [rows])

  if (loading) {
    return <p className="jury-results__status">Cargando resultados de 2ª ronda…</p>
  }

  if (error) {
    return <p className="jury-results__error">{error}</p>
  }

  if (!aggregated.length) {
    return (
      <p className="jury-results__status">
        Todavía no hay calificaciones de jurados para la 2ª ronda.
      </p>
    )
  }

  return (
    <div className="jury-results">
      <header className="jury-results__header">
        <h2>Resultados · 2ª ronda</h2>
        <p>
          Promedio por concursante según las calificaciones de todos los jurados
          (máximo 25 puntos).
        </p>
      </header>

      <div className="jury-results__table-wrap">
        <table className="jury-results__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Emprendimiento</th>
              <th>Categoría</th>
              <th>Jurados</th>
              <th>Promedio</th>
              <th>Suma totales</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {aggregated.map((entry, index) => {
              const open = expandedId === entry.competitorId
              return (
                <Fragment key={entry.competitorId}>
                  <tr>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{entry.ventureName}</strong>
                      {entry.fullName ? (
                        <div className="jury-results__sub">{entry.fullName}</div>
                      ) : null}
                      {entry.sector ? (
                        <div className="jury-results__sub">
                          {labelOf(SECTORS, entry.sector)}
                        </div>
                      ) : null}
                    </td>
                    <td>{labelOf(CATEGORIES, entry.category) || '—'}</td>
                    <td>{entry.juryCount}</td>
                    <td>
                      <strong>{entry.avgTotal.toFixed(1)}</strong>
                      <span className="jury-results__muted"> / 25</span>
                    </td>
                    <td>{entry.sumTotal}</td>
                    <td>
                      <button
                        type="button"
                        className="jury-results__toggle"
                        onClick={() =>
                          setExpandedId(open ? null : entry.competitorId)
                        }
                      >
                        {open ? 'Ocultar' : 'Detalle'}
                      </button>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="jury-results__detail-row">
                      <td colSpan={7}>
                        <div className="jury-results__detail">
                          <div className="jury-results__avgs">
                            {JURY_ROUND2_CRITERIA.map((c) => (
                              <div key={c.key}>
                                <span>{c.label}</span>
                                <strong>
                                  {entry.avgByCriterion[c.key].toFixed(1)}
                                </strong>
                              </div>
                            ))}
                          </div>

                          <ul className="jury-results__scores">
                            {entry.scores.map((score) => (
                              <li key={score.id}>
                                <div className="jury-results__score-head">
                                  <span>
                                    Jurado · {String(score.juror_id).slice(0, 8)}…
                                  </span>
                                  <strong>Total {score.total}/25</strong>
                                </div>
                                <div className="jury-results__score-grid">
                                  {JURY_ROUND2_CRITERIA.map((c) => (
                                    <span key={c.key}>
                                      {c.label}: {score[c.key]}
                                    </span>
                                  ))}
                                </div>
                                {score.observaciones ? (
                                  <p className="jury-results__obs">
                                    “{score.observaciones}”
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
