import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  getSession,
  signOut,
  ensureProfile,
  getProfile,
  fetchCompetitorRegistrations,
  fetchAttendeeRegistrations,
  fetchSponsorRegistrations,
  fetchExhibitorRegistrations,
  confirmCompetitorPayment,
  confirmAttendeePayment,
  confirmSponsorPayment,
  confirmExhibitorPayment,
  updateCompetitorProgress,
  setAttendeeCheckedIn,
  resendAttendeeTicket,
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
  SPONSOR_PLAN_LABELS,
  EXHIBITOR_STAND_TYPES,
  COMPETITION_STAGES,
  COMPETITION_STAGE_ORDER,
} from '../data/content.js'
import JuryRound2Results from './JuryRound2Results.jsx'
import AdminCheckIn from './AdminCheckIn.jsx'
import './Admin.css'

const TABS = [
  { id: 'acceso', label: 'Acceso' },
  { id: 'competidores', label: 'Competidores' },
  { id: 'asistentes', label: 'Asistentes' },
  { id: 'patrocinadores', label: 'Patrocinadores' },
  { id: 'expositores', label: 'Expositores' },
  { id: 'resultados-2ronda', label: 'Resultados 2ª ronda' },
]

const COMPETITOR_COLUMNS = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'status', label: 'Pago' },
  { key: 'competition_stage', label: 'Avance' },
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
  { key: 'status', label: 'Estado' },
  { key: 'ticket_number', label: 'Ticket #' },
  { key: 'checked_in', label: 'Ingreso' },
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
  { key: 'status', label: 'Estado' },
  { key: 'company_name', label: 'Empresa / Marca' },
  { key: 'contact_name', label: 'Contacto' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'plan', label: 'Plan' },
  { key: 'sector', label: 'Sector' },
  { key: 'tax_id', label: 'NIT' },
]

const EXHIBITOR_COLUMNS = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'status', label: 'Estado' },
  { key: 'company_name', label: 'Empresa / Marca' },
  { key: 'contact_name', label: 'Contacto' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'stand_type', label: 'Stand' },
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

function competitionStageLabel(value) {
  if (!value) return 'Pendiente'
  return labelOf(COMPETITION_STAGES, value) || String(value)
}

function nextCompetitionStage(current) {
  const index = COMPETITION_STAGE_ORDER.indexOf(current || 'pendiente')
  if (index < 0 || index >= COMPETITION_STAGE_ORDER.length - 1) return null
  return COMPETITION_STAGE_ORDER[index + 1]
}

function competitorCell(row, key) {
  if (key === 'document') {
    const type = labelOf(DOCUMENT_TYPES, row.document_type) || row.document_type || ''
    const num = row.document_number || ''
    return display(`${type} ${num}`.trim())
  }
  if (key === 'created_at') return display(formatDateTime(row.created_at))
  if (key === 'status') return statusLabel(row.status)
  if (key === 'competition_stage') {
    return display(competitionStageLabel(row.competition_stage))
  }
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
  if (key === 'status') return statusLabel(row.status)
  if (key === 'ticket_number') {
    return row.ticket_number == null ? '—' : `#${row.ticket_number}`
  }
  if (key === 'checked_in') {
    return row.checked_in_at ? 'Sí' : 'No'
  }
  if (key === 'profile') return display(labelOf(ATTENDEE_PROFILES, row.profile))
  if (key === 'seat_type') return display(labelOf(ATTENDEE_SEAT_TYPES, row.seat_type))
  if (key === 'interest') return display(labelOf(ATTENDEE_INTERESTS, row.interest))
  if (key === 'accompanied') return display(accompaniedLabel(row))
  return display(row[key])
}

function sponsorCell(row, key) {
  if (key === 'created_at') return display(formatDateTime(row.created_at))
  if (key === 'status') return statusLabel(row.status)
  if (key === 'plan') return display(labelOf(SPONSOR_PLAN_LABELS, row.plan))
  return display(row[key])
}

function exhibitorCell(row, key) {
  if (key === 'created_at') return display(formatDateTime(row.created_at))
  if (key === 'status') return statusLabel(row.status)
  if (key === 'stand_type') return display(labelOf(EXHIBITOR_STAND_TYPES, row.stand_type))
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
    { label: 'Logo (URL)', value: row.logo_url },
    {
      label: 'Motivo de rechazo',
      value: row.rejection_reason,
      multiline: true,
    },
    { label: 'Revisado el', value: formatDateTime(row.reviewed_at) },
    { label: 'Notas internas', value: row.internal_notes, multiline: true },
    { label: 'Actualizado', value: formatDateTime(row.updated_at) },
    { label: 'ID', value: row.id },
  ]
}

function attendeeDetails(row) {
  return [
    { label: 'Número de ticket', value: row.ticket_number },
    {
      label: 'Ingreso al evento',
      value: row.checked_in_at
        ? formatDateTime(row.checked_in_at)
        : 'Aún no ingresa',
    },
    { label: 'Token QR', value: row.ticket_token },
    { label: 'Empresa / Institución', value: row.organization },
    {
      label: 'Emprendedor que acompaña',
      value: accompaniedLabel(row) || (row.accompanied_competitor_id ? row.accompanied_competitor_id : 'Ninguno'),
    },
    { label: '¿Cómo nos conoció?', value: referralText(row) },
    { label: 'Referencia Wompi', value: row.payment_reference },
    {
      label: 'Monto (centavos)',
      value: row.amount_in_cents == null ? null : String(row.amount_in_cents),
    },
    { label: 'ID transacción Wompi', value: row.wompi_transaction_id },
    { label: 'Confirmación de pago', value: row.payment_confirmation },
    { label: 'Revisado el', value: formatDateTime(row.reviewed_at) },
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
    { label: 'Referencia Wompi', value: row.payment_reference },
    {
      label: 'Monto (centavos)',
      value: row.amount_in_cents == null ? null : String(row.amount_in_cents),
    },
    { label: 'ID transacción Wompi', value: row.wompi_transaction_id },
    { label: 'Confirmación de pago', value: row.payment_confirmation },
    { label: 'Revisado el', value: formatDateTime(row.reviewed_at) },
    { label: 'Actualizado', value: formatDateTime(row.updated_at) },
    { label: 'ID', value: row.id },
  ]
}

function exhibitorDetails(row) {
  return [
    { label: 'Cargo del contacto', value: row.contact_role },
    { label: 'Sitio web / red social', value: row.website },
    { label: 'Comentarios', value: row.comments, multiline: true },
    { label: '¿Cómo nos conoció?', value: referralText(row) },
    { label: 'Referencia Wompi', value: row.payment_reference },
    {
      label: 'Monto (centavos)',
      value: row.amount_in_cents == null ? null : String(row.amount_in_cents),
    },
    { label: 'ID transacción Wompi', value: row.wompi_transaction_id },
    { label: 'Confirmación de pago', value: row.payment_confirmation },
    { label: 'Revisado el', value: formatDateTime(row.reviewed_at) },
    { label: 'Actualizado', value: formatDateTime(row.updated_at) },
    { label: 'ID', value: row.id },
  ]
}

function rowKeyOf(row, index) {
  return row.id ?? `${row.email || 'row'}-${row.created_at || index}`
}

function tabConfig(tab) {
  if (tab === 'resultados-2ronda') {
    return {
      title: 'Resultados · 2ª ronda',
      columns: [],
      cellValue: () => '',
      detailFields: () => [],
      empty: '',
      canConfirmPayment: false,
      confirmPayment: null,
      setRows: null,
      exportFile: 'resultados-2ronda',
      exportSheet: 'Resultados',
    }
  }
  if (tab === 'asistentes') {
    return {
      title: 'Inscripciones · Asistentes',
      columns: ATTENDEE_COLUMNS,
      cellValue: attendeeCell,
      detailFields: attendeeDetails,
      empty: 'Todavía no hay registros de asistentes.',
      canConfirmPayment: true,
      confirmPayment: confirmAttendeePayment,
      setRows: 'attendees',
      exportFile: 'asistentes',
      exportSheet: 'Asistentes',
    }
  }
  if (tab === 'patrocinadores') {
    return {
      title: 'Inscripciones · Patrocinadores',
      columns: SPONSOR_COLUMNS,
      cellValue: sponsorCell,
      detailFields: sponsorDetails,
      empty: 'Todavía no hay registros de patrocinadores.',
      canConfirmPayment: true,
      confirmPayment: confirmSponsorPayment,
      setRows: 'sponsors',
      exportFile: 'patrocinadores',
      exportSheet: 'Patrocinadores',
    }
  }
  if (tab === 'expositores') {
    return {
      title: 'Inscripciones · Expositores',
      columns: EXHIBITOR_COLUMNS,
      cellValue: exhibitorCell,
      detailFields: exhibitorDetails,
      empty: 'Todavía no hay registros de expositores.',
      canConfirmPayment: true,
      confirmPayment: confirmExhibitorPayment,
      setRows: 'exhibitors',
      exportFile: 'expositores',
      exportSheet: 'Expositores',
    }
  }
  return {
    title: 'Inscripciones · Competidores',
    columns: COMPETITOR_COLUMNS,
    cellValue: competitorCell,
    detailFields: competitorDetails,
    empty: 'Todavía no hay inscripciones de competidores.',
    canConfirmPayment: true,
    confirmPayment: confirmCompetitorPayment,
    setRows: 'competitors',
    exportFile: 'competidores',
    exportSheet: 'Competidores',
  }
}

function tabRowCount(itemId, counts) {
  if (itemId === 'resultados-2ronda' || itemId === 'acceso') return '·'
  if (itemId === 'asistentes') return counts.attendees
  if (itemId === 'patrocinadores') return counts.sponsors
  if (itemId === 'expositores') return counts.exhibitors
  return counts.competitors
}

function excelValue(value) {
  if (value == null || value === '' || value === '—') return ''
  return String(value)
}

function buildExcelRows(rows, columns, cellValue, detailFields) {
  return rows.map((row) => {
    const record = {}
    for (const col of columns) {
      record[col.label] = excelValue(cellValue(row, col.key))
    }
    for (const field of detailFields(row)) {
      if (Object.prototype.hasOwnProperty.call(record, field.label)) continue
      record[field.label] = excelValue(display(field.value))
    }
    return record
  })
}

function downloadExcel(rows, config) {
  const data = buildExcelRows(
    rows,
    config.columns,
    config.cellValue,
    config.detailFields
  )
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, config.exportSheet)

  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `shark-caribe-${config.exportFile}-${stamp}.xlsx`)
}

export default function Admin() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking')
  const [email, setEmail] = useState('')
  const [tab, setTab] = useState('competidores')
  const [competitorRows, setCompetitorRows] = useState([])
  const [attendeeRows, setAttendeeRows] = useState([])
  const [sponsorRows, setSponsorRows] = useState([])
  const [exhibitorRows, setExhibitorRows] = useState([])
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [paymentCodes, setPaymentCodes] = useState({})
  const [paymentBusyId, setPaymentBusyId] = useState(null)
  const [paymentError, setPaymentError] = useState('')
  const [paymentOkId, setPaymentOkId] = useState(null)
  const [seatFilter, setSeatFilter] = useState('')
  const [standFilter, setStandFilter] = useState('')
  const [progressDrafts, setProgressDrafts] = useState({})
  const [progressBusyId, setProgressBusyId] = useState(null)
  const [progressError, setProgressError] = useState('')
  const [progressOkId, setProgressOkId] = useState(null)
  const [checkInBusyId, setCheckInBusyId] = useState(null)
  const [resendBusyId, setResendBusyId] = useState(null)
  const [accessMsg, setAccessMsg] = useState('')
  const [accessErr, setAccessErr] = useState('')

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
          if (profile?.role === 'jurado') {
            navigate('/jurado', { replace: true })
            return
          }
          setStatus('forbidden')
          return
        }

        const [competitors, attendees, sponsors, exhibitors] = await Promise.all([
          fetchCompetitorRegistrations(),
          fetchAttendeeRegistrations().catch((err) => {
            console.error('[Shark Caribe] Admin attendees load:', err)
            return { __error: err }
          }),
          fetchSponsorRegistrations().catch((err) => {
            console.error('[Shark Caribe] Admin sponsors load:', err)
            return { __error: err }
          }),
          fetchExhibitorRegistrations().catch((err) => {
            console.error('[Shark Caribe] Admin exhibitors load:', err)
            return { __error: err }
          }),
        ])
        if (cancelled) return

        setCompetitorRows(competitors)
        setAttendeeRows(Array.isArray(attendees) ? attendees : [])
        setSponsorRows(Array.isArray(sponsors) ? sponsors : [])
        setExhibitorRows(Array.isArray(exhibitors) ? exhibitors : [])

        const sideErrors = [attendees, sponsors, exhibitors]
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
    setProgressError('')
    setProgressOkId(null)
    setAccessMsg('')
    setAccessErr('')
    if (next !== 'asistentes') setSeatFilter('')
    if (next !== 'expositores') setStandFilter('')
  }

  const patchAttendeeCheckIn = (payload) => {
    if (!payload?.id) return
    setAttendeeRows((prev) =>
      prev.map((r) =>
        r.id === payload.id
          ? { ...r, checked_in_at: payload.checked_in_at ?? r.checked_in_at }
          : r
      )
    )
  }

  const handleToggleCheckIn = async (row, checkedIn) => {
    setAccessErr('')
    setAccessMsg('')
    setCheckInBusyId(row.id)
    try {
      const data = await setAttendeeCheckedIn(row.id, checkedIn)
      setAttendeeRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, checked_in_at: data.checked_in_at ?? null }
            : r
        )
      )
      setAccessMsg(
        checkedIn
          ? `Ingreso marcado: ${data.full_name || row.full_name}`
          : `Ingreso deshecho: ${data.full_name || row.full_name}`
      )
    } catch (err) {
      setAccessErr(err?.message || 'No pudimos actualizar el ingreso.')
    } finally {
      setCheckInBusyId(null)
    }
  }

  const handleResendTicket = async (row) => {
    setAccessErr('')
    setAccessMsg('')
    setResendBusyId(row.id)
    try {
      const data = await resendAttendeeTicket(row.id)
      setAccessMsg(
        `Ticket reenviado a ${data?.to || row.email}${
          data?.ticket_number != null ? ` (#${data.ticket_number})` : ''
        }.`
      )
    } catch (err) {
      setAccessErr(err?.message || 'No pudimos reenviar el ticket.')
    } finally {
      setResendBusyId(null)
    }
  }

  const seedProgressDraft = (row) => {
    if (!row?.id) return
    setProgressDrafts((prev) => ({
      ...prev,
      [row.id]: {
        stage: row.competition_stage || 'pendiente',
        logoUrl: row.logo_url || '',
        rejectionReason: row.rejection_reason || '',
      },
    }))
  }

  const toggleExpand = (rowKey, row) => {
    setExpandedId((prev) => {
      const next = prev === rowKey ? null : rowKey
      if (next && row) seedProgressDraft(row)
      return next
    })
    setPaymentError('')
    setPaymentOkId(null)
    setProgressError('')
    setProgressOkId(null)
  }

  const updateProgressDraft = (id, field, value) => {
    setProgressDrafts((prev) => ({
      ...prev,
      [id]: {
        stage: prev[id]?.stage || 'pendiente',
        logoUrl: prev[id]?.logoUrl || '',
        rejectionReason: prev[id]?.rejectionReason || '',
        [field]: value,
      },
    }))
    setProgressError('')
    setProgressOkId(null)
  }

  const handleSaveProgress = async (row, overrides = {}) => {
    const draft = {
      stage: progressDrafts[row.id]?.stage || row.competition_stage || 'pendiente',
      logoUrl: progressDrafts[row.id]?.logoUrl ?? row.logo_url ?? '',
      rejectionReason:
        progressDrafts[row.id]?.rejectionReason ?? row.rejection_reason ?? '',
      ...overrides,
    }

    setProgressError('')
    setProgressOkId(null)
    setProgressBusyId(row.id)
    try {
      const updated = await updateCompetitorProgress(row.id, {
        competitionStage: draft.stage,
        logoUrl: draft.logoUrl,
        rejectionReason: draft.rejectionReason,
      })
      setCompetitorRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                competition_stage: updated.competition_stage,
                logo_url: updated.logo_url,
                rejection_reason: updated.rejection_reason,
                reviewed_at: updated.reviewed_at,
                updated_at: updated.updated_at,
              }
            : r
        )
      )
      setProgressDrafts((prev) => ({
        ...prev,
        [row.id]: {
          stage: updated.competition_stage || 'pendiente',
          logoUrl: updated.logo_url || '',
          rejectionReason: updated.rejection_reason || '',
        },
      }))
      setProgressOkId(row.id)
    } catch (err) {
      setProgressError(err?.message || 'No pudimos guardar el avance.')
    } finally {
      setProgressBusyId(null)
    }
  }

  const handleAdvanceCompetitor = async (row) => {
    const current =
      progressDrafts[row.id]?.stage || row.competition_stage || 'pendiente'
    if (current === 'rechazado') {
      setProgressError('Un competidor rechazado no puede avanzar. Cambia la etapa primero.')
      return
    }
    const next = nextCompetitionStage(current)
    if (!next) {
      setProgressError('Este competidor ya está en la etapa final (ganador).')
      return
    }
    updateProgressDraft(row.id, 'stage', next)
    await handleSaveProgress(row, { stage: next })
  }

  const handleSeatFilter = (value) => {
    setSeatFilter(value)
    setExpandedId(null)
    setPaymentError('')
    setPaymentOkId(null)
  }

  const handleStandFilter = (value) => {
    setStandFilter(value)
    setExpandedId(null)
    setPaymentError('')
    setPaymentOkId(null)
  }

  const handleConfirmPayment = async (row) => {
    const code = paymentCodes[row.id] ?? ''
    const cfg = tabConfig(tab)
    setPaymentError('')
    setPaymentOkId(null)
    setPaymentBusyId(row.id)
    try {
      const updated = await cfg.confirmPayment(row.id, code)
      const patch = (prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: updated.status,
                payment_confirmation: updated.payment_confirmation,
                reviewed_at: updated.reviewed_at,
                updated_at: updated.updated_at,
                ticket_number:
                  updated.ticket_number ?? r.ticket_number ?? null,
              }
            : r
        )
      if (cfg.setRows === 'attendees') setAttendeeRows(patch)
      else if (cfg.setRows === 'sponsors') setSponsorRows(patch)
      else if (cfg.setRows === 'exhibitors') setExhibitorRows(patch)
      else setCompetitorRows(patch)

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
  const allRows =
    tab === 'asistentes'
      ? attendeeRows
      : tab === 'patrocinadores'
        ? sponsorRows
        : tab === 'expositores'
          ? exhibitorRows
          : competitorRows

  const rows =
    tab === 'asistentes' && seatFilter
      ? allRows.filter((row) => row.seat_type === seatFilter)
      : tab === 'expositores' && standFilter
        ? allRows.filter((row) => row.stand_type === standFilter)
        : allRows

  const emptyMessage =
    tab === 'asistentes' && seatFilter && allRows.length > 0 && rows.length === 0
      ? 'No hay registros con esta ubicación.'
      : tab === 'expositores' && standFilter && allRows.length > 0 && rows.length === 0
        ? 'No hay registros con este tipo de stand.'
        : config.empty

  const tableRows = rows.flatMap((row, index) => {
    const rowKey = rowKeyOf(row, index)
    const isOpen = expandedId === rowKey
    const statusClass = row.status
      ? `admin__status admin__status--${String(row.status).replace(/\s+/g, '_')}`
      : 'admin__status'

    const stageClass = row.competition_stage
      ? `admin__status admin__status--stage-${String(row.competition_stage)}`
      : 'admin__status'

    const mainRow = (
      <tr key={rowKey} className={isOpen ? 'admin__row--open' : undefined}>
        <td>
          <button
            type="button"
            className="admin__toggle"
            aria-expanded={isOpen}
            onClick={() => toggleExpand(rowKey, row)}
          >
            {isOpen ? 'Ocultar' : 'Ver'}
          </button>
        </td>
        {config.columns.map((c) => (
          <td key={c.key}>
            {c.key === 'status' ? (
              <span className={statusClass}>{config.cellValue(row, c.key)}</span>
            ) : c.key === 'competition_stage' ? (
              <span className={stageClass}>{config.cellValue(row, c.key)}</span>
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

    const progressDraft = progressDrafts[row.id] || {
      stage: row.competition_stage || 'pendiente',
      logoUrl: row.logo_url || '',
      rejectionReason: row.rejection_reason || '',
    }
    const advanceTo = nextCompetitionStage(progressDraft.stage)
    const canManageProgress = tab === 'competidores' && row.id

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

          {canManageProgress && (
            <form
              className="admin__progress"
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveProgress(row)
              }}
            >
              <p className="admin__pay-title">Avance en la competencia</p>

              <label className="admin__pay-field">
                <span>Etapa</span>
                <select
                  value={progressDraft.stage}
                  onChange={(e) =>
                    updateProgressDraft(row.id, 'stage', e.target.value)
                  }
                  disabled={progressBusyId === row.id}
                >
                  {COMPETITION_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin__pay-field admin__pay-field--wide">
                <span>URL del logo</span>
                <input
                  type="url"
                  autoComplete="off"
                  placeholder="https://…"
                  value={progressDraft.logoUrl}
                  onChange={(e) =>
                    updateProgressDraft(row.id, 'logoUrl', e.target.value)
                  }
                  disabled={progressBusyId === row.id}
                />
              </label>

              {progressDraft.stage === 'rechazado' && (
                <label className="admin__pay-field admin__pay-field--wide">
                  <span>Motivo de rechazo *</span>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explica por qué no continúa en la competencia"
                    value={progressDraft.rejectionReason}
                    onChange={(e) =>
                      updateProgressDraft(row.id, 'rejectionReason', e.target.value)
                    }
                    disabled={progressBusyId === row.id}
                  />
                </label>
              )}

              <div className="admin__progress-actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={progressBusyId === row.id}
                >
                  {progressBusyId === row.id ? 'Guardando…' : 'Guardar avance'}
                </button>
                {advanceTo && (
                  <button
                    type="button"
                    className="btn btn--outline"
                    disabled={progressBusyId === row.id}
                    onClick={() => handleAdvanceCompetitor(row)}
                  >
                    Avanzar a {competitionStageLabel(advanceTo)}
                  </button>
                )}
              </div>

              {progressError && expandedId === rowKey && (
                <p className="admin__pay-error">{progressError}</p>
              )}
              {progressOkId === row.id && (
                <p className="admin__pay-ok">Avance guardado.</p>
              )}
            </form>
          )}

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

          {tab === 'asistentes' && row.status === 'pago' && (
            <div className="admin__access-actions">
              <p className="admin__pay-title">Ticket / ingreso</p>
              {!row.checked_in_at ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={checkInBusyId === row.id}
                  onClick={() => handleToggleCheckIn(row, true)}
                >
                  {checkInBusyId === row.id ? 'Guardando…' : 'Marcar llegada'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--outline"
                  disabled={checkInBusyId === row.id}
                  onClick={() => handleToggleCheckIn(row, false)}
                >
                  {checkInBusyId === row.id ? 'Guardando…' : 'Deshacer ingreso'}
                </button>
              )}
              <button
                type="button"
                className="btn btn--outline"
                disabled={resendBusyId === row.id}
                onClick={() => handleResendTicket(row)}
              >
                {resendBusyId === row.id ? 'Enviando…' : 'Reenviar ticket'}
              </button>
              {accessErr && expandedId === rowKey && (
                <p className="admin__pay-error">{accessErr}</p>
              )}
              {accessMsg && expandedId === rowKey && (
                <p className="admin__pay-ok">{accessMsg}</p>
              )}
            </div>
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
                    {tabRowCount(item.id, {
                      competitors: competitorRows.length,
                      attendees: attendeeRows.length,
                      sponsors: sponsorRows.length,
                      exhibitors: exhibitorRows.length,
                    })}
                  </span>
                </button>
              ))}
            </div>

            {tab === 'acceso' ? (
              <AdminCheckIn onCheckedIn={patchAttendeeCheckIn} />
            ) : tab === 'resultados-2ronda' ? (
              <JuryRound2Results />
            ) : (
              <>
            {tab === 'asistentes' && (
              <div className="admin__filters" role="group" aria-label="Filtrar por ubicación">
                <span className="admin__filters-label">Ubicación</span>
                <button
                  type="button"
                  className={`admin__filter ${seatFilter === '' ? 'is-active' : ''}`}
                  aria-pressed={seatFilter === ''}
                  onClick={() => handleSeatFilter('')}
                >
                  Todas
                </button>
                {ATTENDEE_SEAT_TYPES.map((seat) => (
                  <button
                    key={seat.value}
                    type="button"
                    className={`admin__filter ${seatFilter === seat.value ? 'is-active' : ''}`}
                    aria-pressed={seatFilter === seat.value}
                    onClick={() => handleSeatFilter(seat.value)}
                  >
                    {seat.label}
                  </button>
                ))}
              </div>
            )}

            {tab === 'expositores' && (
              <div className="admin__filters" role="group" aria-label="Filtrar por stand">
                <span className="admin__filters-label">Stand</span>
                <button
                  type="button"
                  className={`admin__filter ${standFilter === '' ? 'is-active' : ''}`}
                  aria-pressed={standFilter === ''}
                  onClick={() => handleStandFilter('')}
                >
                  Todas
                </button>
                {EXHIBITOR_STAND_TYPES.map((stand) => (
                  <button
                    key={stand.value}
                    type="button"
                    className={`admin__filter ${standFilter === stand.value ? 'is-active' : ''}`}
                    aria-pressed={standFilter === stand.value}
                    onClick={() => handleStandFilter(stand.value)}
                  >
                    {stand.dimensions}
                  </button>
                ))}
              </div>
            )}

            {rows.length === 0 ? (
              <p className="admin__muted">{emptyMessage}</p>
            ) : (
              <>
                <div className="admin__toolbar">
                  <p className="admin__count">
                    {rows.length} registro{rows.length === 1 ? '' : 's'}
                    {tab === 'asistentes' && seatFilter
                      ? ` · ${labelOf(ATTENDEE_SEAT_TYPES, seatFilter)}`
                      : ''}
                    {tab === 'expositores' && standFilter
                      ? ` · ${labelOf(EXHIBITOR_STAND_TYPES, standFilter)}`
                      : ''}
                  </p>
                  <button
                    type="button"
                    className="btn btn--primary admin__export"
                    onClick={() => downloadExcel(rows, config)}
                  >
                    Descargar Excel
                  </button>
                </div>
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
          </>
        )}
      </main>
    </div>
  )
}
