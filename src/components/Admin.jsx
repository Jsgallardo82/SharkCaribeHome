import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSession,
  signOut,
  ensureProfile,
  getProfile,
  fetchCompetitorRegistrations,
  fetchAttendeeRegistrations,
  fetchSponsorRegistrations,
  confirmCompetitorPayment,
  isSupabaseConfigured,
} from '../lib/supabase.js'
import {
  DOCUMENT_TYPES,
  CATEGORIES,
  CONTACT_METHODS,
  SECTORS,
  REFERRAL_SOURCES,
  ATTENDEE_DOCUMENT_TYPES,
  ATTENDEE_PROFILES,
  ATTENDEE_INTERESTS,
  ATTENDEE_SEAT_TYPES,
  SPONSOR_PLANS,
} from '../data/content.js'
import './Admin.css'

const TABS = [
  { id: 'competidores', label: 'Competidores' },
  { id: 'asistentes', label: 'Asistentes' },
  { id: 'patrocinadores', label: 'Patrocinadores' },
]

const COMPETITOR_COLUMNS = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'status', label: 'Estado' },
  { key: 'full_name', label: 'Nombre' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'category', label: 'Categoría' },
  { key: 'venture_name', label: 'Emprendimiento' },
  { key: 'sector', label: 'Sector' },
  { key: 'document', label: 'Documento' },
  { key: 'code', label: 'Código' },
]

const ATTENDEE_COLUMNS = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'full_name', label: 'Nombre' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'profile', label: 'Perfil' },
  { key: 'seat_type', label: 'Ubicación' },
  { key: 'interest', label: 'Interés' },
  { key: 'document', label: 'Documento' },
  { key: 'accompanied', label: 'Emprendedor' },
]

const SPONSOR_COLUMNS = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'company_name', label: 'Empresa / Marca' },
  { key: 'contact_name', label: 'Contacto' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'plan', label: 'Plan' },
  { key: 'sector', label: 'Sector' },
  { key: 'tax_id', label: 'NIT' },
]

const STATUS_LABELS = {
  pending: 'Pendiente',
  pago: 'Pago',
  under_review: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
}

function labelOf(options, value) {
  if (value == null || value === '') return null
  const found = options.find((o) => o.value === value)
  return found ? found.label : String(value)
}

function formatDateTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) return null
  const raw = String(value).slice(0, 10)
  const [y, m, d] = raw.split('-').map(Number)
  if (!y || !m || !d) return String(value)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function display(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function statusLabel(value) {
  if (!value) return '—'
  return STATUS_LABELS[value] || String(value)
}

function referralText(row) {
  const referral = labelOf(REFERRAL_SOURCES, row.referral_source)
  if (row.referral_source === 'other' && row.referral_source_other) {
    return `${referral || 'Otro'}: ${row.referral_source_other}`
  }
  return referral
}

function accompaniedLabel(row) {
  const info = row.accompanied
  if (!info) return null
  const name = info.full_name || ''
  const venture = info.venture_name || ''
  const text = [name, venture].filter(Boolean).join(' — ')
  return text || null
}

function competitorCell(row, key) {
  if (key === 'document') {
    const type = labelOf(DOCUMENT_TYPES, row.document_type) || row.document_type || ''
    const num = row.document_number || ''
    return display(`${type} ${num}`.trim())
  }
  if (key === 'created_at') return display(formatDateTime(row.created_at))
  if (key === 'status') return statusLabel(row.status)
  if (key === 'category') return display(labelOf(CATEGORIES, row.category))
  if (key === 'sector') return display(labelOf(SECTORS, row.sector))
  if (key === 'code') return display(row.code)
  return display(row[key])
}

function attendeeCell(row, key) {
  if (key === 'document') {
    const type =
      labelOf(ATTENDEE_DOCUMENT_TYPES, row.document_type) || row.document_type || ''
    const num = row.document_number || ''
    return display(`${type} ${num}`.trim())
  }
  if (key === 'created_at') return display(formatDateTime(row.created_at))
  if (key === 'profile') return display(labelOf(ATTENDEE_PROFILES, row.profile))
  if (key === 'seat_type') return display(labelOf(ATTENDEE_SEAT_TYPES, row.seat_type))
  if (key === 'interest') return display(labelOf(ATTENDEE_INTERESTS, row.interest))
  if (key === 'accompanied') return display(accompaniedLabel(row))
  return display(row[key])
}

function sponsorCell(row, key) {
  if (key === 'created_at') return display(formatDateTime(row.created_at))
  if (key === 'plan') return display(labelOf(SPONSOR_PLANS, row.plan))
  return display(row[key])
}

function competitorDetails(row) {
  return [
    { label: 'Fecha de nacimiento', value: formatDate(row.birth_date) },
    { label: 'Edad al inscribirse', value: row.age_at_registration },
    {
      label: 'Contacto preferido',
      value: labelOf(CONTACT_METHODS, row.preferred_contact),
    },
    { label: 'Problema que resuelve', value: row.problem_solved, multiline: true },
    { label: '¿Cómo nos conoció?', value: referralText(row) },
    { label: 'Confirmación de pago', value: row.payment_confirmation },
    {
      label: 'Términos aceptados',
      value: row.accepted_terms == null ? null : row.accepted_terms ? 'Sí' : 'No',
    },
    { label: 'Revisado el', value: formatDateTime(row.reviewed_at) },
    { label: 'Motivo de rechazo', value: row.rejection_reason, multiline: true },
    { label: 'Notas internas', value: row.internal_notes, multiline: true },
    { label: 'Actualizado', value: formatDateTime(row.updated_at) },
    { label: 'ID', value: row.id },
  ]
}

function attendeeDetails(row) {
  return [
    { label: 'Empresa / Institución', value: row.organization },
    {
      label: 'Emprendedor que acompaña',
      value: accompaniedLabel(row) || (row.accompanied_competitor_id ? row.accompanied_competitor_id : 'Ninguno'),
    },
    { label: '¿Cómo nos conoció?', value: referralText(row) },
    { label: 'Actualizado', value: formatDateTime(row.updated_at) },
    { label: 'ID', value: row.id },
  ]
}

function sponsorDetails(row) {
  return [
    { label: 'Cargo del contacto', value: row.contact_role },
    { label: 'Sitio web / red social', value: row.website },
    { label: 'Comentarios', value: row.comments, multiline: true },
    { label: '¿Cómo nos conoció?', value: referralText(row) },
    { label: 'Actualizado', value: formatDateTime(row.updated_at) },
    { label: 'ID', value: row.id },
  ]
}

function rowKeyOf(row, index) {
  return row.id ?? `${row.email || 'row'}-${row.created_at || index}`
}

function tabConfig(tab) {
  if (tab === 'asistentes') {
    return {
      title: 'Inscripciones · Asistentes',
      columns: ATTENDEE_COLUMNS,
      cellValue: attendeeCell,
      detailFields: attendeeDetails,
      empty: 'Todavía no hay registros de asistentes.',
      canConfirmPayment: false,
    }
  }
  if (tab === 'patrocinadores') {
    return {
      title: 'Inscripciones · Patrocinadores',
      columns: SPONSOR_COLUMNS,
      cellValue: sponsorCell,
      detailFields: sponsorDetails,
      empty: 'Todavía no hay registros de patrocinadores.',
      canConfirmPayment: false,
    }
  }
  return {
    title: 'Inscripciones · Competidores',
    columns: COMPETITOR_COLUMNS,
    cellValue: competitorCell,
    detailFields: competitorDetails,
    empty: 'Todavía no hay inscripciones de competidores.',
    canConfirmPayment: true,
  }
}

export default function Admin() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking')
  const [email, setEmail] = useState('')
  const [tab, setTab] = useState('competidores')
  const [competitorRows, setCompetitorRows] = useState([])
  const [attendeeRows, setAttendeeRows] = useState([])
  const [sponsorRows, setSponsorRows] = useState([])
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [paymentCodes, setPaymentCodes] = useState({})
  const [paymentBusyId, setPaymentBusyId] = useState(null)
  const [paymentError, setPaymentError] = useState('')
  const [paymentOkId, setPaymentOkId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        if (!isSupabaseConfigured) {
          if (!cancelled) {
            setError(
              'Supabase no está configurado. Revisa VITE_PUBLIC_SUPABASE_URL y la publishable key en .env.local.'
            )
            setStatus('error')
          }
          return
        }

        const session = await getSession()
        if (cancelled) return

        if (!session) {
          navigate('/login', { replace: true })
          return
        }

        setEmail(session.user?.email || '')
        setStatus('loading')
        setError('')

        await ensureProfile()
        if (cancelled) return

        const profile = await getProfile()
        if (cancelled) return

        if (!profile || profile.role !== 'admin') {
          setStatus('forbidden')
          return
        }

        const [competitors, attendees, sponsors] = await Promise.all([
          fetchCompetitorRegistrations(),
          fetchAttendeeRegistrations().catch((err) => {
            console.error('[Shark Caribe] Admin attendees load:', err)
            return { __error: err }
          }),
          fetchSponsorRegistrations().catch((err) => {
            console.error('[Shark Caribe] Admin sponsors load:', err)
            return { __error: err }
          }),
        ])
        if (cancelled) return

        setCompetitorRows(competitors)
        setAttendeeRows(Array.isArray(attendees) ? attendees : [])
        setSponsorRows(Array.isArray(sponsors) ? sponsors : [])

        const sideErrors = [attendees, sponsors]
          .filter((r) => r && r.__error)
          .map((r) => r.__error?.message)
          .filter(Boolean)
        if (sideErrors.length) {
          setError(sideErrors.join(' '))
        }

        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error('[Shark Caribe] Admin load error:', err)
        setError(err?.message || 'Error al cargar el panel.')
        setStatus('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const switchTab = (next) => {
    setTab(next)
    setExpandedId(null)
    setPaymentError('')
    setPaymentOkId(null)
  }

  const toggleExpand = (rowKey) => {
    setExpandedId((prev) => (prev === rowKey ? null : rowKey))
    setPaymentError('')
    setPaymentOkId(null)
  }

  const handleConfirmPayment = async (row) => {
    const code = paymentCodes[row.id] ?? ''
    setPaymentError('')
    setPaymentOkId(null)
    setPaymentBusyId(row.id)
    try {
      const updated = await confirmCompetitorPayment(row.id, code)
      setCompetitorRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: updated.status,
                payment_confirmation: updated.payment_confirmation,
                reviewed_at: updated.reviewed_at,
                updated_at: updated.updated_at,
              }
            : r
        )
      )
      setPaymentCodes((prev) => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
      setPaymentOkId(row.id)
    } catch (err) {
      setPaymentError(err?.message || 'No pudimos confirmar el pago.')
    } finally {
      setPaymentBusyId(null)
    }
  }

  const config = tabConfig(tab)
  const rows =
    tab === 'asistentes'
      ? attendeeRows
      : tab === 'patrocinadores'
        ? sponsorRows
        : competitorRows

  const tableRows = rows.flatMap((row, index) => {
    const rowKey = rowKeyOf(row, index)
    const isOpen = expandedId === rowKey
    const statusClass = row.status
      ? `admin__status admin__status--${String(row.status).replace(/\s+/g, '_')}`
      : 'admin__status'

    const mainRow = (
      <tr key={rowKey} className={isOpen ? 'admin__row--open' : undefined}>
        <td>
          <button
            type="button"
            className="admin__toggle"
            aria-expanded={isOpen}
            onClick={() => toggleExpand(rowKey)}
          >
            {isOpen ? 'Ocultar' : 'Ver'}
          </button>
        </td>
        {config.columns.map((c) => (
          <td key={c.key}>
            {c.key === 'status' ? (
              <span className={statusClass}>{config.cellValue(row, c.key)}</span>
            ) : (
              config.cellValue(row, c.key)
            )}
          </td>
        ))}
      </tr>
    )

    if (!isOpen) return [mainRow]

    const canConfirmPayment =
      config.canConfirmPayment && row.status === 'pending' && row.id

    const detailRow = (
      <tr key={`${rowKey}-detail`} className="admin__detail-row">
        <td colSpan={config.columns.length + 1}>
          <dl className="admin__detail">
            {config.detailFields(row).map((field) => (
              <div
                key={field.label}
                className={
                  field.multiline
                    ? 'admin__detail-item admin__detail-item--wide'
                    : 'admin__detail-item'
                }
              >
                <dt>{field.label}</dt>
                <dd className={field.multiline ? 'admin__detail-text' : undefined}>
                  {display(field.value)}
                </dd>
              </div>
            ))}
          </dl>

          {canConfirmPayment && (
            <form
              className="admin__pay"
              onSubmit={(e) => {
                e.preventDefault()
                handleConfirmPayment(row)
              }}
            >
              <p className="admin__pay-title">Confirmar pago</p>
              <label className="admin__pay-field">
                <span>Código de pago</span>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Ej. referencia de transferencia"
                  value={paymentCodes[row.id] ?? ''}
                  onChange={(e) =>
                    setPaymentCodes((prev) => ({
                      ...prev,
                      [row.id]: e.target.value,
                    }))
                  }
                  disabled={paymentBusyId === row.id}
                />
              </label>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={paymentBusyId === row.id}
              >
                {paymentBusyId === row.id ? 'Guardando…' : 'Marcar como pago'}
              </button>
              {paymentError && expandedId === rowKey && (
                <p className="admin__pay-error">{paymentError}</p>
              )}
            </form>
          )}

          {paymentOkId === row.id && (
            <p className="admin__pay-ok">Pago confirmado.</p>
          )}
        </td>
      </tr>
    )

    return [mainRow, detailRow]
  })

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <h1 className="admin__title">{config.title}</h1>
          <p className="admin__user">
            {email ? `Sesión: ${email}` : 'Verificando sesión…'}
          </p>
        </div>
        <div className="admin__actions">
          <button
            type="button"
            className="admin__link"
            onClick={() => navigate('/')}
          >
            Ver sitio
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="admin__body">
        {status === 'checking' && (
          <p className="admin__muted">Verificando sesión…</p>
        )}

        {status === 'loading' && (
          <p className="admin__muted">Cargando inscripciones…</p>
        )}

        {status === 'forbidden' && (
          <div className="admin__error">
            <p>
              No tienes permisos de administrador para ver este panel. Si
              crees que es un error, pide que te asignen el rol{' '}
              <code>admin</code> en tu perfil.
            </p>
            <div className="admin__forbidden-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate('/')}
              >
                Ir al sitio
              </button>
              <button type="button" className="admin__link-dark" onClick={handleSignOut}>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {status === 'error' && <p className="admin__error">{error}</p>}

        {status === 'ready' && error && (
          <p className="admin__error" style={{ marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {status === 'ready' && (
          <>
            <div className="admin__tabs" role="tablist" aria-label="Tipo de inscripción">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={`admin__tab ${tab === item.id ? 'is-active' : ''}`}
                  onClick={() => switchTab(item.id)}
                >
                  {item.label}
                  <span className="admin__tab-count">
                    {item.id === 'asistentes'
                      ? attendeeRows.length
                      : item.id === 'patrocinadores'
                        ? sponsorRows.length
                        : competitorRows.length}
                  </span>
                </button>
              ))}
            </div>

            {rows.length === 0 ? (
              <p className="admin__muted">{config.empty}</p>
            ) : (
              <>
                <p className="admin__count">
                  {rows.length} registro{rows.length === 1 ? '' : 's'}
                </p>
                <div className="admin__table-wrap">
                  <table className="admin__table">
                    <thead>
                      <tr>
                        <th className="admin__th-toggle" aria-label="Detalle" />
                        {config.columns.map((c) => (
                          <th key={c.key}>{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>{tableRows}</tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
