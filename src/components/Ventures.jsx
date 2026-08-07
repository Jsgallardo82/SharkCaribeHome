import { useEffect, useState } from 'react'
import Ticket, { Barcode } from './Ticket.jsx'
import { SECTORS } from '../data/content.js'
import { fetchPublicVentures } from '../lib/supabase.js'
import './Ventures.css'

function formatSector(value) {
  if (!value) return ''
  const known = SECTORS.find((s) => s.value === value)
  if (known) return known.label
  return String(value).replaceAll('_', ' ')
}

/* Secciones públicas alineadas con competitor_competition_stage (sin rechazado). */
const SECTIONS = [
  {
    id: 'inscritos',
    label: 'Inscritos',
    stages: ['pendiente', 'aprobado'],
  },
  {
    id: 'segunda_ronda',
    label: 'Segunda ronda',
    stages: ['segunda_vuelta'],
  },
  {
    id: 'tercera_ronda',
    label: 'Tercera ronda',
    stages: ['tercera_vuelta'],
  },
  {
    id: 'finalistas',
    label: 'Finalistas',
    stages: ['final'],
  },
  {
    id: 'ganadores',
    label: 'Ganadores',
    stages: ['ganador'],
  },
]

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

function VentureGrid({ items }) {
  if (items.length === 0) {
    return (
      <p className="ventures__empty">Aún no hay emprendimientos en esta lista.</p>
    )
  }

  return (
    <ul className="ventures__grid">
      {items.map((venture) => (
        <li key={venture.id || `${venture.stage}-${venture.name}`} className="venture">
          <div className="venture__logo">
            {venture.logo ? (
              <img src={venture.logo} alt="" loading="lazy" />
            ) : (
              <span className="venture__placeholder" aria-hidden="true">
                {initials(venture.name)}
              </span>
            )}
          </div>
          <p className="venture__name">{venture.name}</p>
          {venture.sector && (
            <p className="venture__sector">{formatSector(venture.sector)}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function Ventures() {
  const [ventures, setVentures] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')

    fetchPublicVentures()
      .then((rows) => {
        if (!cancelled) setVentures(rows)
      })
      .catch((err) => {
        console.error('[Shark Caribe] Ventures:', err)
        if (!cancelled) {
          setVentures([])
          setLoadError('No pudimos cargar los emprendimientos. Inténtalo más tarde.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: ventures.filter((v) => section.stages.includes(v.stage)),
  })).filter((section) => section.items.length > 0)

  return (
    <section id="emprendimientos" className="section">
      <div className="container">
        <Ticket
          className="ticket--section ventures-ticket"
          stub={
            <div className="ventures-ticket__stub">
              <span className="ventures-ticket__stub-label">Concursantes</span>
              <Barcode variant="light" className="ventures-ticket__barcode" />
            </div>
          }
        >
          <div className="ventures-ticket__main">
            <h2 className="section__title">Emprendimientos en competencia</h2>

            {loading && (
              <p className="ventures__empty">Cargando emprendimientos…</p>
            )}

            {loadError && (
              <p className="ventures__empty" role="alert">
                {loadError}
              </p>
            )}

            {!loading && !loadError && ventures.length === 0 && (
              <p className="ventures__empty">
                Pronto verás aquí a los emprendimientos con inscripción confirmada.
              </p>
            )}

            {!loading && !loadError && ventures.length > 0 && (
              <div className="ventures__sections">
                {visibleSections.map((section) => (
                  <div key={section.id} className="ventures__block">
                    <h3 className="ventures__heading">
                      {section.label}
                      <span className="ventures__count">{section.items.length}</span>
                    </h3>
                    <VentureGrid items={section.items} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Ticket>
      </div>
    </section>
  )
}
