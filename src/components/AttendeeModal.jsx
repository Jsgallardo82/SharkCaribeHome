import { useEffect, useRef, useState } from 'react'
import {
  ATTENDEE_REGISTRATION,
  ATTENDEE_DOCUMENT_TYPES,
  ATTENDEE_PROFILES,
  ATTENDEE_INTERESTS,
  ATTENDEE_SEAT_TYPES,
  REFERRAL_SOURCES,
  SUPPORT_EMAIL,
  REGISTRATION,
} from '../data/content.js'
import {
  createAttendeeWompiCheckout,
  fetchPublicCompetitors,
  submitAttendeeRegistration,
} from '../lib/supabase.js'
import {
  isWompiPaymentsEnabled,
  redirectToWompiCheckout,
  friendlyWompiError,
} from '../lib/wompi.js'
import './RegisterModal.css'

const EMPTY_FORM = {
  fullName: '',
  documentType: '',
  documentNumber: '',
  email: '',
  phone: '',
  profile: '',
  organization: '',
  interest: '',
  seatType: '',
  accompaniedCompetitorId: '',
  referralSource: '',
  referralSourceOther: '',
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

function validate(form) {
  const errors = {}

  if (form.fullName.trim().length < 3) {
    errors.fullName = 'Escribe tu nombre completo.'
  }
  if (!form.documentType) {
    errors.documentType = 'Selecciona tu tipo de documento.'
  }
  if (form.documentNumber.trim().length < 5) {
    errors.documentNumber = 'El número de documento debe tener al menos 5 caracteres.'
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Escribe un correo electrónico válido.'
  }
  if (form.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Escribe un número de celular válido.'
  }
  if (!form.profile) {
    errors.profile = 'Selecciona tu perfil u ocupación.'
  }
  if (!form.interest) {
    errors.interest = 'Indica tu principal interés al asistir.'
  }
  if (!form.seatType) {
    errors.seatType = 'Selecciona tu ubicación (preferencial o general).'
  }
  if (!form.referralSource) {
    errors.referralSource = 'Cuéntanos cómo te enteraste.'
  } else if (form.referralSource === 'other' && !form.referralSourceOther.trim()) {
    errors.referralSourceOther = 'Especifica por qué medio te enteraste.'
  }

  return errors
}

export default function AttendeeModal({ onClose, initialSeatType = '' }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    seatType: ATTENDEE_SEAT_TYPES.some((s) => s.value === initialSeatType)
      ? initialSeatType
      : '',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)
  const [paidOnline, setPaidOnline] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [competitors, setCompetitors] = useState([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)
  const wompiReady = isWompiPaymentsEnabled()

  const panelRef = useRef(null)
  const submittingRef = useRef(false)
  submittingRef.current = submitting

  const selectedSeat = ATTENDEE_SEAT_TYPES.find((s) => s.value === form.seatType)
  const feeDisplay = selectedSeat?.priceLabel || 'Según ubicación elegida'

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape' && !submittingRef.current) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    setCompetitorsLoading(true)
    fetchPublicCompetitors()
      .then((rows) => {
        if (!cancelled) setCompetitors(rows)
      })
      .finally(() => {
        if (!cancelled) setCompetitorsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setSubmitError('')
  }

  function validateOrScroll() {
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const firstField = Object.keys(found)[0]
      panelRef.current
        ?.querySelector(`[data-field="${firstField}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateOrScroll()) return

    setSubmitting(true)
    setSubmitError('')
    try {
      await submitAttendeeRegistration(form)
      setPaidOnline(false)
      setPaymentStatus('')
      setPaymentReference('')
      setDone(true)
      panelRef.current?.scrollTo({ top: 0 })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayOnline() {
    if (!validateOrScroll()) return
    if (!wompiReady) {
      console.warn('[Shark Caribe][Wompi] Botón pago: falta VITE_WOMPI_PUBLIC_KEY')
      setSubmitError(
        'El pago en línea aún no está configurado. Usa “Enviar registro” o escríbenos.'
      )
      return
    }

    setSubmitting(true)
    setSubmitError('')
    console.info('[Shark Caribe][Wompi] Flujo pagar iniciado', {
      seatType: form.seatType,
      email: form.email,
    })
    try {
      const checkout = await createAttendeeWompiCheckout(form)
      setPaymentReference(checkout.reference || '')
      console.info('[Shark Caribe][Wompi] Registro OK, redirigiendo a Wompi…', {
        reference: checkout.reference,
      })
      // Navegación completa a Web Checkout (no vuelve a este finally con éxito)
      redirectToWompiCheckout(checkout)
    } catch (error) {
      console.error('[Shark Caribe][Wompi] Flujo pagar falló', error)
      setSubmitError(friendlyWompiError(error))
      setSubmitting(false)
    }
  }

  function handleClose() {
    if (submitting) return
    onClose()
  }

  return (
    <div
      className="modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendee-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="modal__close"
          onClick={handleClose}
          disabled={submitting}
          aria-label="Cerrar formulario de inscripción"
        >
          ×
        </button>

        {done ? (
          <div className="modal__body modal__success">
            <div className="modal__success-icon" aria-hidden="true">
              ✓
            </div>
            {paidOnline ? (
              <>
                <h2 id="attendee-title">
                  {paymentStatus === 'APPROVED'
                    ? '¡Pago recibido!'
                    : 'Registro y pago en proceso'}
                </h2>
                <p>
                  {paymentStatus === 'APPROVED'
                    ? 'Tu entrada quedó registrada. La confirmación final llega cuando Wompi nos notifica el pago (suele ser inmediato).'
                    : 'Guardamos tu inscripción y recibimos el resultado del checkout. Si el pago fue aprobado, tu entrada se confirmará automáticamente en breve.'}
                </p>
                {paymentReference && (
                  <p className="field__hint">
                    Referencia: <code>{paymentReference}</code>
                  </p>
                )}
                {paymentStatus && paymentStatus !== 'APPROVED' && (
                  <p className="field__hint">
                    Estado Wompi: <strong>{paymentStatus}</strong>. Si fue rechazado,
                    puedes intentar de nuevo desde Entradas.
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 id="attendee-title">¡Recibimos tu registro!</h2>
                <p>
                  Tu inscripción como asistente quedó registrada en estado{' '}
                  <strong>pendiente</strong>. Para confirmarla:
                </p>
                <ol className="modal__steps">
                  <li>
                    Paga <strong>{feeDisplay}</strong> a la {REGISTRATION.paymentKeyLabel}{' '}
                    <code>{REGISTRATION.paymentKey}</code>.
                  </li>
                  <li>
                    Envía el comprobante a{' '}
                    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> con tu nombre
                    y documento en el asunto. Cuando validemos el pago, tu entrada quedará
                    confirmada.
                  </li>
                </ol>
              </>
            )}
            <button type="button" className="btn btn--primary" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form className="modal__body" onSubmit={handleSubmit} noValidate>
            <header className="modal__header">
              <h2 id="attendee-title">{ATTENDEE_REGISTRATION.title}</h2>
              <p className="modal__intro">{ATTENDEE_REGISTRATION.intro}</p>
            </header>

            <div className="modal__fee">
              <p>
                <strong>{ATTENDEE_REGISTRATION.feeLabel}:</strong> {feeDisplay}
              </p>
              <p className="field__hint">{ATTENDEE_REGISTRATION.feeHint}</p>
              {selectedSeat && (
                <p className="field__hint">
                  {selectedSeat.label}: {selectedSeat.description}
                </p>
              )}
            </div>

            <div className="field" data-field="fullName">
              <label className="field__label" htmlFor="att-name">
                Nombre completo <span className="field__req">*</span>
              </label>
              <input
                id="att-name"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
              />
              {errors.fullName && <p className="field__error">{errors.fullName}</p>}
            </div>

            <fieldset className="field" data-field="documentType">
              <legend className="field__label">
                Tipo de documento de identificación <span className="field__req">*</span>
              </legend>
              <div className="options">
                {ATTENDEE_DOCUMENT_TYPES.map((doc) => (
                  <label className="radio" key={doc.value}>
                    <input
                      type="radio"
                      name="attDocumentType"
                      value={doc.value}
                      checked={form.documentType === doc.value}
                      onChange={(e) => update('documentType', e.target.value)}
                    />
                    <span>{doc.label}</span>
                  </label>
                ))}
              </div>
              {errors.documentType && <p className="field__error">{errors.documentType}</p>}
            </fieldset>

            <div className="field" data-field="documentNumber">
              <label className="field__label" htmlFor="att-doc">
                Número de documento <span className="field__req">*</span>
              </label>
              <input
                id="att-doc"
                type="text"
                value={form.documentNumber}
                onChange={(e) => update('documentNumber', e.target.value)}
              />
              {errors.documentNumber && (
                <p className="field__error">{errors.documentNumber}</p>
              )}
            </div>

            <div className="field" data-field="email">
              <label className="field__label" htmlFor="att-email">
                Correo electrónico <span className="field__req">*</span>
              </label>
              <input
                id="att-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
              {errors.email && <p className="field__error">{errors.email}</p>}
            </div>

            <div className="field" data-field="phone">
              <label className="field__label" htmlFor="att-phone">
                Celular / WhatsApp <span className="field__req">*</span>
              </label>
              <input
                id="att-phone"
                type="tel"
                autoComplete="tel"
                placeholder="300 000 0000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
              {errors.phone && <p className="field__error">{errors.phone}</p>}
            </div>

            <div className="field" data-field="profile">
              <label className="field__label" htmlFor="att-profile">
                Perfil / Ocupación principal <span className="field__req">*</span>
              </label>
              <select
                id="att-profile"
                value={form.profile}
                onChange={(e) => update('profile', e.target.value)}
              >
                <option value="">Selecciona una opción…</option>
                {ATTENDEE_PROFILES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.profile && <p className="field__error">{errors.profile}</p>}
            </div>

            <div className="field" data-field="organization">
              <label className="field__label" htmlFor="att-org">
                Empresa / Institución / Universidad
              </label>
              <input
                id="att-org"
                type="text"
                value={form.organization}
                onChange={(e) => update('organization', e.target.value)}
              />
            </div>

            <div className="field" data-field="interest">
              <label className="field__label" htmlFor="att-interest">
                ¿Cuál es su principal interés al asistir a Shark Caribe 2026?{' '}
                <span className="field__req">*</span>
              </label>
              <select
                id="att-interest"
                value={form.interest}
                onChange={(e) => update('interest', e.target.value)}
              >
                <option value="">Selecciona una opción…</option>
                {ATTENDEE_INTERESTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.interest && <p className="field__error">{errors.interest}</p>}
            </div>

            <fieldset className="field" data-field="seatType">
              <legend className="field__label">
                Ubicación <span className="field__req">*</span>
              </legend>
              <div className="options">
                {ATTENDEE_SEAT_TYPES.map((seat) => (
                  <label className="radio" key={seat.value}>
                    <input
                      type="radio"
                      name="attSeatType"
                      value={seat.value}
                      checked={form.seatType === seat.value}
                      onChange={(e) => update('seatType', e.target.value)}
                    />
                    <span>
                      {seat.label} · {seat.priceLabel}
                    </span>
                  </label>
                ))}
              </div>
              {errors.seatType && <p className="field__error">{errors.seatType}</p>}
            </fieldset>

            <div className="field" data-field="accompaniedCompetitorId">
              <label className="field__label" htmlFor="att-competitor">
                Nombre del emprendedor que acompañan
              </label>
              <select
                id="att-competitor"
                value={form.accompaniedCompetitorId}
                onChange={(e) => update('accompaniedCompetitorId', e.target.value)}
                disabled={competitorsLoading}
              >
                <option value="">
                  {competitorsLoading ? 'Cargando emprendedores…' : 'Ninguno'}
                </option>
                {competitors.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.full_name}
                    {row.venture_name ? ` — ${row.venture_name}` : ''}
                  </option>
                ))}
              </select>
              <p className="field__hint">
                Si no acompañas a un emprendedor, deja “Ninguno”.
                {!competitorsLoading && competitors.length === 0
                  ? ' Por ahora no hay emprendedores con pago confirmado para listar.'
                  : ''}
              </p>
            </div>

            <fieldset className="field" data-field="referralSource">
              <legend className="field__label">
                ¿Cómo se enteró del evento? <span className="field__req">*</span>
              </legend>
              <div className="options">
                {REFERRAL_SOURCES.map((source) => (
                  <label className="radio" key={source.value}>
                    <input
                      type="radio"
                      name="attReferralSource"
                      value={source.value}
                      checked={form.referralSource === source.value}
                      onChange={(e) => update('referralSource', e.target.value)}
                    />
                    <span>{source.label}</span>
                  </label>
                ))}
              </div>
              {form.referralSource === 'other' && (
                <input
                  type="text"
                  className="field__inline-input"
                  placeholder="¿Cuál?"
                  aria-label="Especifica por qué medio se enteró"
                  value={form.referralSourceOther}
                  onChange={(e) => update('referralSourceOther', e.target.value)}
                />
              )}
              {errors.referralSource && (
                <p className="field__error">{errors.referralSource}</p>
              )}
              {errors.referralSourceOther && (
                <p className="field__error">{errors.referralSourceOther}</p>
              )}
            </fieldset>

            {submitError && (
              <p className="modal__alert" role="alert">
                {submitError}
              </p>
            )}

            <footer className="modal__footer">
              <button
                type="button"
                className="btn modal__cancel"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Enviar registro'}
              </button>
              {wompiReady && (
                <button
                  type="button"
                  className="btn btn--pay-online modal__pay-later"
                  onClick={handlePayOnline}
                  disabled={submitting}
                  title="Registra tu entrada y paga con Wompi"
                >
                  {submitting ? 'Abriendo pago…' : 'Inscribirse e ir a pagar'}
                </button>
              )}
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
