import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSession,
  signOut,
  fetchCompetitorRegistrations,
  confirmCompetitorPayment,
  isSupabaseConfigured,
} from '../lib/supabase.js'
import {
  DOCUMENT_TYPES,
  CATEGORIES,
  CONTACT_METHODS,
  SECTORS,
  REFERRAL_SOURCES,
} from '../data/content.js'
import './Admin.css'

const COLUMNS = [
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
  /* birth_date llega como YYYY-MM-DD; evitar desfase de zona horaria */
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

function cellValue(row, key) {
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

function detailFields(row) {
  const referral = labelOf(REFERRAL_SOURCES, row.referral_source)
  const referralText =
    row.referral_source === 'other' && row.referral_source_other
      ? `${referral || 'Otro'}: ${row.referral_source_other}`
      : referral

  return [
    { label: 'Fecha de nacimiento', value: formatDate(row.birth_date) },
    { label: 'Edad al inscribirse', value: row.age_at_registration },
    {
      label: 'Contacto preferido',
      value: labelOf(CONTACT_METHODS, row.preferred_contact),
    },
    { label: 'Problema que resuelve', value: row.problem_solved, multiline: true },
    { label: '¿Cómo nos conoció?', value: referralText },
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

function rowKeyOf(row, index) {
  return row.id ?? `${row.email || 'row'}-${row.created_at || index}`
}

export default function Admin() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking') // checking | loading | ready | error
  const [email, setEmail] = useState('')
  const [rows, setRows] = useState([])
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

        const data = await fetchCompetitorRegistrations()
        if (cancelled) return

        setRows(data)
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
      setRows((prev) =>
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
        {COLUMNS.map((c) => (
          <td key={c.key}>
            {c.key === 'status' ? (
              <span className={statusClass}>{cellValue(row, c.key)}</span>
            ) : (
              cellValue(row, c.key)
            )}
          </td>
        ))}
      </tr>
    )

    if (!isOpen) return [mainRow]

    const canConfirmPayment = row.status === 'pending' && row.id

    const detailRow = (
      <tr key={`${rowKey}-detail`} className="admin__detail-row">
        <td colSpan={COLUMNS.length + 1}>
          <dl className="admin__detail">
            {detailFields(row).map((field) => (
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
                {paymentBusyId === row.id
                  ? 'Guardando…'
                  : 'Marcar como pago'}
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
          <h1 className="admin__title">Inscripciones · Competidores</h1>
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

        {status === 'error' && <p className="admin__error">{error}</p>}

        {status === 'ready' && rows.length === 0 && (
          <p className="admin__muted">
            Todavía no hay inscripciones (o la política RLS no permite leerlas).
          </p>
        )}

        {status === 'ready' && rows.length > 0 && (
          <>
            <p className="admin__count">
              {rows.length} inscripción{rows.length === 1 ? '' : 'es'}
            </p>
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th className="admin__th-toggle" aria-label="Detalle" />
                    {COLUMNS.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{tableRows}</tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
