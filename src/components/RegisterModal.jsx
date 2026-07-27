import { useEffect, useRef, useState } from 'react'
import {
  REGISTRATION,
  DOCUMENT_TYPES,
  CATEGORIES,
  CONTACT_METHODS,
  SECTORS,
  REFERRAL_SOURCES,
  SUPPORT_EMAIL,
  TERMS_URL,
} from '../data/content.js'
import { submitCompetitorRegistration } from '../lib/supabase.js'
import './RegisterModal.css'

const EMPTY_FORM = {
  acceptedTerms: false,
  fullName: '',
  documentType: '',
  documentNumber: '',
  birthDate: '',
  category: '',
  preferredContact: '',
  phone: '',
  email: '',
  ventureName: '',
  sector: '',
  problemSolved: '',
  referralSource: '',
  referralSourceOther: '',
}

/* Edad cumplida a día de hoy. Devuelve null si la fecha no sirve. */
function ageFromBirthDate(value) {
  if (!value) return null
  const birth = new Date(`${value}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age
}

/* Misma regla que el trigger de Postgres. Si cambia una, cambia la otra. */
function categoryForAge(age) {
  if (age === null || age < 10) return ''
  const match = CATEGORIES.find((c) => age >= c.min && age <= c.max)
  return match ? match.value : ''
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

function validate(form) {
  const errors = {}
  const age = ageFromBirthDate(form.birthDate)

  if (!form.acceptedTerms) {
    errors.acceptedTerms = 'Debes aceptar los términos y condiciones para continuar.'
  }
  if (form.fullName.trim().length < 3) {
    errors.fullName = 'Escribe tu nombre completo.'
  }
  if (!form.documentType) {
    errors.documentType = 'Selecciona tu tipo de documento.'
  }
  if (form.documentNumber.trim().length < 5) {
    errors.documentNumber = 'El número de documento debe tener al menos 5 caracteres.'
  }
  if (!form.birthDate) {
    errors.birthDate = 'Indica tu fecha de nacimiento.'
  } else if (age === null) {
    errors.birthDate = 'La fecha de nacimiento no es válida.'
  } else if (age < 10) {
    errors.birthDate = 'La edad mínima para competir es 10 años.'
  }
  if (!form.category) {
    errors.category = 'Indica tu fecha de nacimiento para asignar tu categoría.'
  }
  if (!form.preferredContact) {
    errors.preferredContact = 'Dinos cómo prefieres que te contactemos.'
  }
  if (form.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Escribe un número de celular válido.'
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Escribe un correo electrónico válido.'
  }
  if (form.ventureName.trim().length < 2) {
    errors.ventureName = 'Escribe el nombre de tu emprendimiento.'
  }
  if (!form.sector) {
    errors.sector = 'Selecciona el sector de tu emprendimiento.'
  }
  if (form.problemSolved.trim().length < 20) {
    errors.problemSolved = 'Cuéntanos con un poco más de detalle (mínimo 20 caracteres).'
  }
  if (!form.referralSource) {
    errors.referralSource = 'Cuéntanos cómo te enteraste.'
  } else if (form.referralSource === 'other' && !form.referralSourceOther.trim()) {
    errors.referralSourceOther = 'Especifica por qué medio te enteraste.'
  }

  return errors
}

/* Se monta y desmonta con cada apertura (ver App.jsx). Así el estado nace
   limpio siempre, sin importar cómo se cerró la vez anterior: botón, clic
   en el fondo o tecla Escape. */
export default function RegisterModal({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  const panelRef = useRef(null)
  const submittingRef = useRef(false)
  submittingRef.current = submitting

  /* Escape para cerrar, bloqueo del scroll de fondo y devolución del foco */
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

  const age = ageFromBirthDate(form.birthDate)
  const today = new Date().toISOString().slice(0, 10)

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      /* La categoría no se elige a mano: se deriva de la fecha de nacimiento,
         igual que hace el trigger en la base de datos. */
      if (field === 'birthDate') {
        next.category = categoryForAge(ageFromBirthDate(value))
      }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      if (field === 'birthDate') delete next.category
      return next
    })
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const firstField = Object.keys(found)[0]
      panelRef.current
        ?.querySelector(`[data-field="${firstField}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      await submitCompetitorRegistration(form)
      setDone(true)
      panelRef.current?.scrollTo({ top: 0 })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
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
        aria-labelledby="register-title"
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
            <h2 id="register-title">¡Recibimos tu postulación!</h2>
            <p>
              Tu inscripción queda registrada. Faltan dos pasos para confirmarla:
            </p>
            <ol className="modal__steps">
              <li>
                Paga <strong>{REGISTRATION.feeAmount}</strong> a la{' '}
                {REGISTRATION.paymentKeyLabel}{' '}
                <code>{REGISTRATION.paymentKey}</code>.
              </li>
              <li>
                Envía el <strong>comprobante de pago</strong> y la{' '}
                <strong>fotocopia de tu documento</strong> a{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, poniendo tu
                nombre y número de documento en el asunto.
              </li>
            </ol>
            <p className="field__hint">
              Cuando validemos el pago te confirmamos por{' '}
              {form.preferredContact === 'whatsapp' ? 'WhatsApp' : 'correo electrónico'} y
              desde ahí cuentas con 72 horas para enviar tu video explicativo de 60
              segundos.
            </p>
            <button type="button" className="btn btn--primary" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form className="modal__body" onSubmit={handleSubmit} noValidate>
            <header className="modal__header">
              <h2 id="register-title">{REGISTRATION.title}</h2>
              <p className="modal__intro">{REGISTRATION.intro}</p>
            </header>

            {/* --- Costos y soportes --- */}
            <div className="modal__fee">
              <p>
                <strong>{REGISTRATION.feeLabel}:</strong> {REGISTRATION.feeAmount}
              </p>
              <p className="field__hint">{REGISTRATION.feeHint}</p>
            </div>

            {/* --- 1. Términos y condiciones --- */}
            <fieldset className="field" data-field="acceptedTerms">
              <legend className="field__label">
                Términos y condiciones <span className="field__req">*</span>
              </legend>
              <ol className="modal__terms">
                {REGISTRATION.terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ol>
              <a
                href={TERMS_URL}
                className="modal__terms-link"
                download
              >
                ↓ Descargar términos de referencia completos
              </a>
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={(e) => update('acceptedTerms', e.target.checked)}
                />
                <span>Acepto los términos y condiciones</span>
              </label>
              {errors.acceptedTerms && <p className="field__error">{errors.acceptedTerms}</p>}
            </fieldset>

            {/* --- 2. Nombre --- */}
            <div className="field" data-field="fullName">
              <label className="field__label" htmlFor="reg-name">
                Su nombre <span className="field__req">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
              />
              {errors.fullName && <p className="field__error">{errors.fullName}</p>}
            </div>

            {/* --- 3. Tipo de documento --- */}
            <fieldset className="field" data-field="documentType">
              <legend className="field__label">
                Tipo de documento de identificación <span className="field__req">*</span>
              </legend>
              <div className="options">
                {DOCUMENT_TYPES.map((doc) => (
                  <label className="radio" key={doc.value}>
                    <input
                      type="radio"
                      name="documentType"
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

            {/* --- 4. Número de documento --- */}
            <div className="field" data-field="documentNumber">
              <label className="field__label" htmlFor="reg-doc">
                Número de documento <span className="field__req">*</span>
              </label>
              <input
                id="reg-doc"
                type="text"
                inputMode="numeric"
                value={form.documentNumber}
                onChange={(e) => update('documentNumber', e.target.value)}
              />
              {errors.documentNumber && <p className="field__error">{errors.documentNumber}</p>}
            </div>

            {/* --- Fecha de nacimiento --- */}
            <div className="field" data-field="birthDate">
              <label className="field__label" htmlFor="reg-birth">
                Fecha de nacimiento <span className="field__req">*</span>
              </label>
              <input
                id="reg-birth"
                type="date"
                min="1900-01-01"
                max={today}
                value={form.birthDate}
                onChange={(e) => update('birthDate', e.target.value)}
              />
              <p className="field__hint">Con ella asignamos tu categoría de competición.</p>
              {errors.birthDate && <p className="field__error">{errors.birthDate}</p>}
            </div>

            {/* --- 5. Categoría (derivada, no editable) --- */}
            <fieldset className="field" data-field="category">
              <legend className="field__label">Categoría de competición</legend>
              <div className="options options--cards">
                {CATEGORIES.map((cat) => {
                  const selected = form.category === cat.value
                  return (
                    <label
                      className={`radio radio--card ${selected ? 'is-selected' : ''}`}
                      key={cat.value}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={selected}
                        disabled
                        readOnly
                      />
                      <span>
                        <strong>{cat.label}</strong>
                        <small>{cat.range}</small>
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="field__hint">
                {form.category
                  ? `Tienes ${age} años, así que compites en la categoría ${
                      CATEGORIES.find((c) => c.value === form.category)?.label
                    }.`
                  : 'Se asigna automáticamente según tu fecha de nacimiento.'}
              </p>
              {errors.category && <p className="field__error">{errors.category}</p>}
            </fieldset>

            {/* --- 6. Medio de contacto --- */}
            <fieldset className="field" data-field="preferredContact">
              <legend className="field__label">
                ¿Cómo quiere ser contactado? <span className="field__req">*</span>
              </legend>
              <div className="options">
                {CONTACT_METHODS.map((method) => (
                  <label className="radio" key={method.value}>
                    <input
                      type="radio"
                      name="preferredContact"
                      value={method.value}
                      checked={form.preferredContact === method.value}
                      onChange={(e) => update('preferredContact', e.target.value)}
                    />
                    <span>{method.label}</span>
                  </label>
                ))}
              </div>
              {errors.preferredContact && (
                <p className="field__error">{errors.preferredContact}</p>
              )}
            </fieldset>

            {/* --- 7. Celular --- */}
            <div className="field" data-field="phone">
              <label className="field__label" htmlFor="reg-phone">
                Celular / WhatsApp <span className="field__req">*</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="300 000 0000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
              {errors.phone && <p className="field__error">{errors.phone}</p>}
            </div>

            {/* --- 8. Correo --- */}
            <div className="field" data-field="email">
              <label className="field__label" htmlFor="reg-email">
                Correo electrónico <span className="field__req">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
              {errors.email && <p className="field__error">{errors.email}</p>}
            </div>

            {/* --- 9. Emprendimiento --- */}
            <div className="field" data-field="ventureName">
              <label className="field__label" htmlFor="reg-venture">
                Nombre de su emprendimiento <span className="field__req">*</span>
              </label>
              <input
                id="reg-venture"
                type="text"
                value={form.ventureName}
                onChange={(e) => update('ventureName', e.target.value)}
              />
              {errors.ventureName && <p className="field__error">{errors.ventureName}</p>}
            </div>

            {/* --- Sector --- */}
            <div className="field" data-field="sector">
              <label className="field__label" htmlFor="reg-sector">
                Sector de su emprendimiento <span className="field__req">*</span>
              </label>
              <select
                id="reg-sector"
                value={form.sector}
                onChange={(e) => update('sector', e.target.value)}
              >
                <option value="">Selecciona un sector…</option>
                {SECTORS.map((sector) => (
                  <option key={sector.value} value={sector.value}>
                    {sector.label}
                  </option>
                ))}
              </select>
              <p className="field__hint">
                Solo se admiten emprendimientos de estos nueve sectores.
              </p>
              {errors.sector && <p className="field__error">{errors.sector}</p>}
            </div>

            {/* --- 10. Necesidad que resuelve --- */}
            <div className="field" data-field="problemSolved">
              <label className="field__label" htmlFor="reg-problem">
                ¿Qué necesidad resuelve? <span className="field__req">*</span>
              </label>
              <textarea
                id="reg-problem"
                rows={4}
                maxLength={2000}
                value={form.problemSolved}
                onChange={(e) => update('problemSolved', e.target.value)}
              />
              <p className="field__hint">{form.problemSolved.trim().length} / mínimo 20 caracteres</p>
              {errors.problemSolved && <p className="field__error">{errors.problemSolved}</p>}
            </div>

            {/* --- 11. Cómo se enteró --- */}
            <fieldset className="field" data-field="referralSource">
              <legend className="field__label">
                ¿A través de qué medio se enteró del Pitch Competition Shark Caribe 2026?{' '}
                <span className="field__req">*</span>
              </legend>
              <div className="options">
                {REFERRAL_SOURCES.map((source) => (
                  <label className="radio" key={source.value}>
                    <input
                      type="radio"
                      name="referralSource"
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
              {errors.referralSource && <p className="field__error">{errors.referralSource}</p>}
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
                {submitting ? 'Enviando…' : 'Enviar postulación'}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
