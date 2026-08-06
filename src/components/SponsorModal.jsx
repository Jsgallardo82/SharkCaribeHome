import { useEffect, useRef, useState } from 'react'
import {
  SPONSOR_REGISTRATION,
  SPONSOR_PLANS,
  REFERRAL_SOURCES,
  SUPPORT_EMAIL,
} from '../data/content.js'
import { submitSponsorRegistration } from '../lib/supabase.js'
import './RegisterModal.css'

const EMPTY_FORM = {
  companyName: '',
  taxId: '',
  contactName: '',
  contactRole: '',
  email: '',
  phone: '',
  website: '',
  plan: '',
  sector: '',
  comments: '',
  referralSource: '',
  referralSourceOther: '',
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

function validate(form) {
  const errors = {}

  if (form.companyName.trim().length < 2) {
    errors.companyName = 'Escribe el nombre de la empresa o marca.'
  }
  if (form.taxId.trim().length < 5) {
    errors.taxId = 'Escribe el NIT o identificación tributaria.'
  }
  if (form.contactName.trim().length < 3) {
    errors.contactName = 'Escribe el nombre del contacto principal.'
  }
  if (form.contactRole.trim().length < 2) {
    errors.contactRole = 'Indica el cargo del contacto.'
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Escribe un correo electrónico corporativo válido.'
  }
  if (form.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Escribe un teléfono o WhatsApp válido.'
  }
  if (!form.plan) {
    errors.plan = 'Selecciona el plan de vinculación deseado.'
  }
  if (form.sector.trim().length < 2) {
    errors.sector = 'Indica el sector o industria de la empresa.'
  }
  if (!form.referralSource) {
    errors.referralSource = 'Cuéntanos cómo te enteraste.'
  } else if (form.referralSource === 'other' && !form.referralSourceOther.trim()) {
    errors.referralSourceOther = 'Especifica por qué medio te enteraste.'
  }

  return errors
}

export default function SponsorModal({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  const panelRef = useRef(null)
  const submittingRef = useRef(false)
  submittingRef.current = submitting

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

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
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
      await submitSponsorRegistration(form)
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
        aria-labelledby="sponsor-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="modal__close"
          onClick={handleClose}
          disabled={submitting}
          aria-label="Cerrar formulario de patrocinadores"
        >
          ×
        </button>

        {done ? (
          <div className="modal__body modal__success">
            <div className="modal__success-icon" aria-hidden="true">
              ✓
            </div>
            <h2 id="sponsor-title">¡Recibimos tu solicitud!</h2>
            <p>
              Tu solicitud quedó registrada en estado <strong>pendiente</strong>. El
              equipo comercial revisará tu plan de vinculación y te indicará los
              pasos de pago. Cuando validemos el pago, el registro pasará a
              confirmado.
            </p>
            <p className="field__hint">
              Si tienes urgencia, escribe a{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
            <button type="button" className="btn btn--primary" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form className="modal__body" onSubmit={handleSubmit} noValidate>
            <header className="modal__header">
              <h2 id="sponsor-title">{SPONSOR_REGISTRATION.title}</h2>
              <p className="modal__intro">{SPONSOR_REGISTRATION.intro}</p>
            </header>

            <div className="field" data-field="companyName">
              <label className="field__label" htmlFor="spo-company">
                Nombre de la empresa / Marca <span className="field__req">*</span>
              </label>
              <input
                id="spo-company"
                type="text"
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
              />
              {errors.companyName && <p className="field__error">{errors.companyName}</p>}
            </div>

            <div className="field" data-field="taxId">
              <label className="field__label" htmlFor="spo-tax">
                NIT / Identificación tributaria <span className="field__req">*</span>
              </label>
              <input
                id="spo-tax"
                type="text"
                value={form.taxId}
                onChange={(e) => update('taxId', e.target.value)}
              />
              {errors.taxId && <p className="field__error">{errors.taxId}</p>}
            </div>

            <div className="field" data-field="contactName">
              <label className="field__label" htmlFor="spo-contact">
                Nombre del contacto principal <span className="field__req">*</span>
              </label>
              <input
                id="spo-contact"
                type="text"
                autoComplete="name"
                value={form.contactName}
                onChange={(e) => update('contactName', e.target.value)}
              />
              {errors.contactName && <p className="field__error">{errors.contactName}</p>}
            </div>

            <div className="field" data-field="contactRole">
              <label className="field__label" htmlFor="spo-role">
                Cargo del contacto <span className="field__req">*</span>
              </label>
              <input
                id="spo-role"
                type="text"
                value={form.contactRole}
                onChange={(e) => update('contactRole', e.target.value)}
              />
              {errors.contactRole && <p className="field__error">{errors.contactRole}</p>}
            </div>

            <div className="field" data-field="email">
              <label className="field__label" htmlFor="spo-email">
                Correo electrónico corporativo <span className="field__req">*</span>
              </label>
              <input
                id="spo-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
              {errors.email && <p className="field__error">{errors.email}</p>}
            </div>

            <div className="field" data-field="phone">
              <label className="field__label" htmlFor="spo-phone">
                Teléfono de contacto / WhatsApp <span className="field__req">*</span>
              </label>
              <input
                id="spo-phone"
                type="tel"
                autoComplete="tel"
                placeholder="300 000 0000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
              {errors.phone && <p className="field__error">{errors.phone}</p>}
            </div>

            <div className="field" data-field="website">
              <label className="field__label" htmlFor="spo-web">
                Sitio web / Red social principal
              </label>
              <input
                id="spo-web"
                type="text"
                placeholder="https://…"
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
              />
            </div>

            <section className="sponsor-plans" aria-labelledby="sponsor-plans-title">
              <h3 id="sponsor-plans-title" className="sponsor-plans__title">
                Planes de vinculación
              </h3>
              <p className="sponsor-plans__intro">
                Revisa los beneficios de cada plan y elige el que mejor se adapte
                a tu marca.
              </p>
              <div className="sponsor-plans__list">
                {SPONSOR_PLANS.map((plan) => (
                  <details
                    key={plan.value}
                    className={`sponsor-plans__item ${
                      form.plan === plan.value ? 'is-selected' : ''
                    }`}
                  >
                    <summary className="sponsor-plans__summary">
                      <span>{plan.label}</span>
                      <span className="sponsor-plans__price">{plan.priceLabel}</span>
                    </summary>
                    <div className="sponsor-plans__body">
                      <p className="sponsor-plans__audience">
                        <strong>Público objetivo:</strong> {plan.audience}
                      </p>
                      <p className="sponsor-plans__benefits-label">Beneficios</p>
                      <ul className="sponsor-plans__benefits">
                        {plan.benefits.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      {plan.extraBenefits?.length > 0 && (
                        <>
                          <p className="sponsor-plans__benefits-label">
                            Beneficios adicionales
                          </p>
                          <ul className="sponsor-plans__benefits">
                            {plan.extraBenefits.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn btn--outline sponsor-plans__choose"
                        onClick={() => update('plan', plan.value)}
                      >
                        Elegir {plan.label}
                      </button>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <div className="field" data-field="plan">
              <label className="field__label" htmlFor="spo-plan">
                Interés de vinculación / Plan deseado{' '}
                <span className="field__req">*</span>
              </label>
              <select
                id="spo-plan"
                value={form.plan}
                onChange={(e) => update('plan', e.target.value)}
              >
                <option value="">Selecciona un plan…</option>
                {SPONSOR_PLANS.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </select>
              {errors.plan && <p className="field__error">{errors.plan}</p>}
            </div>

            <div className="field" data-field="sector">
              <label className="field__label" htmlFor="spo-sector">
                Sector / Industria de la empresa <span className="field__req">*</span>
              </label>
              <input
                id="spo-sector"
                type="text"
                value={form.sector}
                onChange={(e) => update('sector', e.target.value)}
              />
              {errors.sector && <p className="field__error">{errors.sector}</p>}
            </div>

            <div className="field" data-field="comments">
              <label className="field__label" htmlFor="spo-comments">
                Comentarios adicionales o requerimientos especiales para la marca
              </label>
              <textarea
                id="spo-comments"
                rows={4}
                maxLength={2000}
                value={form.comments}
                onChange={(e) => update('comments', e.target.value)}
              />
            </div>

            <fieldset className="field" data-field="referralSource">
              <legend className="field__label">
                ¿A través de qué medio se enteró del Pitch Competition Shark Caribe
                2026? <span className="field__req">*</span>
              </legend>
              <div className="options">
                {REFERRAL_SOURCES.map((source) => (
                  <label className="radio" key={source.value}>
                    <input
                      type="radio"
                      name="spoReferralSource"
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
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
              <button
                type="button"
                className="btn btn--outline modal__pay-later"
                disabled
                title="Pronto disponible"
              >
                Inscribirse e ir a pagar
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
