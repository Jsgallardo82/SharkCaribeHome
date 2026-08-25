import { useEffect, useRef, useState } from 'react'
import {
  ATTENDEE_DOCUMENT_TYPES,
  ATTENDEE_INTERESTS,
  ATTENDEE_PROFILES,
  ATTENDEE_SEAT_TYPES,
  COMPETITOR_REGISTRATION_CLOSED,
  EXHIBITOR_STAND_TYPES,
  INSTAGRAM_URL,
  REFERRAL_SOURCES,
  SPONSOR_PLANS,
  SUPPORT_EMAIL,
  UNIFIED_REGISTER,
} from '../data/content.js'
import {
  createEventWompiCheckout,
  fetchPublicCompetitors,
} from '../lib/supabase.js'
import {
  friendlyWompiError,
  isWompiPaymentsEnabled,
  redirectToWompiCheckout,
} from '../lib/wompi.js'
import './RegisterModal.css'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

const CATEGORIES = [
  {
    id: 'publico_preferencial',
    kind: 'asistente',
    seatType: 'preferencial',
    label: 'Público Preferencial',
  },
  {
    id: 'publico_general',
    kind: 'asistente',
    seatType: 'general',
    label: 'Público General',
  },
  { id: 'patrocinador', kind: 'patrocinador', label: 'Patrocinador' },
  {
    id: 'expositor',
    kind: 'expositor',
    label: 'Expositor · Muestra comercial',
  },
  { id: 'competidor', kind: 'competidor', label: 'Competidor' },
]

const EMPTY_ATTENDEE = {
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

const EMPTY_COMPANY = {
  companyName: '',
  taxId: '',
  contactName: '',
  contactRole: '',
  email: '',
  phone: '',
  website: '',
  plan: '',
  standType: '',
  sector: '',
  comments: '',
  referralSource: '',
  referralSourceOther: '',
}

function categoryFromInitial({
  initialCategory = '',
  initialSeatType = '',
  initialStandType = '',
  initialPlan = '',
}) {
  if (initialCategory && CATEGORIES.some((c) => c.id === initialCategory)) {
    return initialCategory
  }
  if (initialSeatType === 'preferencial') return 'publico_preferencial'
  if (initialSeatType === 'general') return 'publico_general'
  if (initialStandType) return 'expositor'
  if (initialPlan) return 'patrocinador'
  return ''
}

function validateAttendee(form) {
  const errors = {}
  if (form.fullName.trim().length < 3) errors.fullName = 'Escribe tu nombre completo.'
  if (!form.documentType) errors.documentType = 'Selecciona tu tipo de documento.'
  if (form.documentNumber.trim().length < 5) {
    errors.documentNumber = 'El número de documento debe tener al menos 5 caracteres.'
  }
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Escribe un correo válido.'
  if (form.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Escribe un celular válido.'
  }
  if (!form.profile) errors.profile = 'Selecciona tu perfil u ocupación.'
  if (!form.interest) errors.interest = 'Indica tu principal interés al asistir.'
  if (!form.seatType) errors.seatType = 'Selecciona tu ubicación.'
  if (!form.referralSource) errors.referralSource = 'Cuéntanos cómo te enteraste.'
  else if (form.referralSource === 'other' && !form.referralSourceOther.trim()) {
    errors.referralSourceOther = 'Especifica por qué medio te enteraste.'
  }
  return errors
}

function validateCompany(form, mode) {
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
    errors.email = 'Escribe un correo corporativo válido.'
  }
  if (form.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Escribe un teléfono o WhatsApp válido.'
  }
  if (mode === 'patrocinador' && !form.plan) {
    errors.plan = 'Selecciona el plan de vinculación deseado.'
  }
  if (mode === 'expositor' && !form.standType) {
    errors.standType = 'Selecciona el tipo de stand.'
  }
  if (form.sector.trim().length < 2) {
    errors.sector = 'Indica el sector o industria de la empresa.'
  }
  if (!form.referralSource) errors.referralSource = 'Cuéntanos cómo te enteraste.'
  else if (form.referralSource === 'other' && !form.referralSourceOther.trim()) {
    errors.referralSourceOther = 'Especifica por qué medio te enteraste.'
  }
  return errors
}

function feeLabelFor(categoryId, form) {
  if (categoryId === 'publico_preferencial' || categoryId === 'publico_general') {
    const seat = ATTENDEE_SEAT_TYPES.find((s) => s.value === form.seatType)
    return seat?.priceLabel || 'Según ubicación'
  }
  if (categoryId === 'patrocinador') {
    const plan = SPONSOR_PLANS.find((p) => p.value === form.plan)
    return plan?.priceLabel || 'Según plan elegido'
  }
  if (categoryId === 'expositor') {
    const stand = EXHIBITOR_STAND_TYPES.find((s) => s.value === form.standType)
    return stand?.priceLabel || 'Según stand elegido'
  }
  return ''
}

export default function UnifiedRegisterModal({
  onClose,
  initialCategory = '',
  initialSeatType = '',
  initialStandType = '',
  initialPlan = '',
  initialAccompaniedCompetitorId = '',
}) {
  const [category, setCategory] = useState(() =>
    categoryFromInitial({
      initialCategory,
      initialSeatType,
      initialStandType,
      initialPlan,
    })
  )
  const [attendee, setAttendee] = useState(() => {
    const seat =
      initialSeatType === 'preferencial' || initialSeatType === 'general'
        ? initialSeatType
        : categoryFromInitial({
              initialCategory,
              initialSeatType,
            }) === 'publico_preferencial'
          ? 'preferencial'
          : categoryFromInitial({ initialCategory, initialSeatType }) ===
              'publico_general'
            ? 'general'
            : ''
    return {
      ...EMPTY_ATTENDEE,
      seatType: seat,
      accompaniedCompetitorId: initialAccompaniedCompetitorId || '',
    }
  })
  const [company, setCompany] = useState(() => ({
    ...EMPTY_COMPANY,
    plan: SPONSOR_PLANS.some((p) => p.value === initialPlan) ? initialPlan : '',
    standType: EXHIBITOR_STAND_TYPES.some((s) => s.value === initialStandType)
      ? initialStandType
      : '',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [competitors, setCompetitors] = useState([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)
  const wompiReady = isWompiPaymentsEnabled()

  const panelRef = useRef(null)
  const submittingRef = useRef(false)
  submittingRef.current = submitting

  const catMeta = CATEGORIES.find((c) => c.id === category)
  const isAttendee =
    category === 'publico_preferencial' || category === 'publico_general'
  const isSponsor = category === 'patrocinador'
  const isExhibitor = category === 'expositor'
  const isCompetitor = category === 'competidor'
  const feeDisplay = feeLabelFor(category, isAttendee ? attendee : company)

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
    if (!isAttendee) return undefined
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
  }, [isAttendee])

  function selectCategory(nextId) {
    setCategory(nextId)
    setErrors({})
    setSubmitError('')
    if (nextId === 'publico_preferencial') {
      setAttendee((prev) => ({ ...prev, seatType: 'preferencial' }))
    } else if (nextId === 'publico_general') {
      setAttendee((prev) => ({ ...prev, seatType: 'general' }))
    }
  }

  function updateAttendee(field, value) {
    setAttendee((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setSubmitError('')
  }

  function updateCompany(field, value) {
    setCompany((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setSubmitError('')
  }

  function validateOrScroll() {
    const found = isAttendee
      ? validateAttendee(attendee)
      : validateCompany(company, isSponsor ? 'patrocinador' : 'expositor')
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

  async function handlePay(event) {
    event.preventDefault()
    if (!category || isCompetitor) return
    if (!validateOrScroll()) return

    if (!wompiReady) {
      setSubmitError(
        'El pago en línea aún no está configurado. Escríbenos a ' +
          SUPPORT_EMAIL +
          '.'
      )
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const kind = catMeta.kind
      const values = isAttendee
        ? {
            fullName: attendee.fullName,
            documentType: attendee.documentType,
            documentNumber: attendee.documentNumber,
            email: attendee.email,
            phone: attendee.phone,
            profile: attendee.profile,
            organization: attendee.organization,
            interest: attendee.interest,
            seatType: attendee.seatType,
            accompaniedCompetitorId: attendee.accompaniedCompetitorId || null,
            referralSource: attendee.referralSource,
            referralSourceOther: attendee.referralSourceOther,
          }
        : {
            companyName: company.companyName,
            taxId: company.taxId,
            contactName: company.contactName,
            contactRole: company.contactRole,
            email: company.email,
            phone: company.phone,
            website: company.website,
            plan: company.plan,
            standType: company.standType,
            sector: company.sector,
            comments: company.comments,
            referralSource: company.referralSource,
            referralSourceOther: company.referralSourceOther,
          }

      const checkout = await createEventWompiCheckout(kind, values)
      redirectToWompiCheckout(checkout)
    } catch (error) {
      console.error('[Shark Caribe][Wompi] Flujo unificado falló', error)
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
        aria-labelledby="unified-register-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="modal__close"
          onClick={handleClose}
          disabled={submitting}
          aria-label="Cerrar compra de ticket"
        >
          ×
        </button>

        {isCompetitor ? (
          <div className="modal__body modal__success">
            <h2 id="unified-register-title">
              {COMPETITOR_REGISTRATION_CLOSED.title}
            </h2>
            <p>{COMPETITOR_REGISTRATION_CLOSED.message}</p>
            <p>
              {COMPETITOR_REGISTRATION_CLOSED.contactHint}{' '}
              <a href={`mailto:${COMPETITOR_REGISTRATION_CLOSED.email}`}>
                {COMPETITOR_REGISTRATION_CLOSED.email}
              </a>
              .
            </p>
            <p>
              También puedes escribirnos por{' '}
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              .
            </p>
            <footer className="modal__footer">
              <button
                type="button"
                className="btn modal__cancel"
                onClick={() => selectCategory('')}
              >
                Elegir otra categoría
              </button>
              <button type="button" className="btn btn--primary" onClick={handleClose}>
                Entendido
              </button>
            </footer>
          </div>
        ) : (
          <form className="modal__body" onSubmit={handlePay} noValidate>
            <header className="modal__header">
              <h2 id="unified-register-title">{UNIFIED_REGISTER.title}</h2>
              <p className="modal__intro">{UNIFIED_REGISTER.intro}</p>
            </header>

            <fieldset className="field" data-field="category">
              <legend className="field__label">
                {UNIFIED_REGISTER.categoryLabel}{' '}
                <span className="field__req">*</span>
              </legend>
              <div className="options">
                {CATEGORIES.map((item) => (
                  <label className="radio" key={item.id}>
                    <input
                      type="radio"
                      name="registerCategory"
                      value={item.id}
                      checked={category === item.id}
                      onChange={() => selectCategory(item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {category && !isCompetitor && (
              <>
                <div className="modal__fee">
                  <p>
                    <strong>{UNIFIED_REGISTER.feeLabel}:</strong> {feeDisplay}
                  </p>
                  <p className="field__hint">{UNIFIED_REGISTER.feeHint}</p>
                </div>

                {isAttendee && (
                  <>
                    <div className="field" data-field="fullName">
                      <label className="field__label" htmlFor="uni-name">
                        Nombre completo <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-name"
                        type="text"
                        autoComplete="name"
                        value={attendee.fullName}
                        onChange={(e) => updateAttendee('fullName', e.target.value)}
                      />
                      {errors.fullName && (
                        <p className="field__error">{errors.fullName}</p>
                      )}
                    </div>

                    <fieldset className="field" data-field="documentType">
                      <legend className="field__label">
                        Tipo de documento <span className="field__req">*</span>
                      </legend>
                      <div className="options">
                        {ATTENDEE_DOCUMENT_TYPES.map((doc) => (
                          <label className="radio" key={doc.value}>
                            <input
                              type="radio"
                              name="uniDocumentType"
                              value={doc.value}
                              checked={attendee.documentType === doc.value}
                              onChange={(e) =>
                                updateAttendee('documentType', e.target.value)
                              }
                            />
                            <span>{doc.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.documentType && (
                        <p className="field__error">{errors.documentType}</p>
                      )}
                    </fieldset>

                    <div className="field" data-field="documentNumber">
                      <label className="field__label" htmlFor="uni-doc">
                        Número de documento <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-doc"
                        type="text"
                        value={attendee.documentNumber}
                        onChange={(e) =>
                          updateAttendee('documentNumber', e.target.value)
                        }
                      />
                      {errors.documentNumber && (
                        <p className="field__error">{errors.documentNumber}</p>
                      )}
                    </div>

                    <div className="field" data-field="email">
                      <label className="field__label" htmlFor="uni-email">
                        Correo electrónico <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-email"
                        type="email"
                        autoComplete="email"
                        value={attendee.email}
                        onChange={(e) => updateAttendee('email', e.target.value)}
                      />
                      {errors.email && <p className="field__error">{errors.email}</p>}
                    </div>

                    <div className="field" data-field="phone">
                      <label className="field__label" htmlFor="uni-phone">
                        Celular / WhatsApp <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="300 000 0000"
                        value={attendee.phone}
                        onChange={(e) => updateAttendee('phone', e.target.value)}
                      />
                      {errors.phone && <p className="field__error">{errors.phone}</p>}
                    </div>

                    <div className="field" data-field="profile">
                      <label className="field__label" htmlFor="uni-profile">
                        Perfil / Ocupación <span className="field__req">*</span>
                      </label>
                      <select
                        id="uni-profile"
                        value={attendee.profile}
                        onChange={(e) => updateAttendee('profile', e.target.value)}
                      >
                        <option value="">Selecciona una opción…</option>
                        {ATTENDEE_PROFILES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      {errors.profile && (
                        <p className="field__error">{errors.profile}</p>
                      )}
                    </div>

                    <div className="field" data-field="organization">
                      <label className="field__label" htmlFor="uni-org">
                        Empresa / Institución / Universidad
                      </label>
                      <input
                        id="uni-org"
                        type="text"
                        value={attendee.organization}
                        onChange={(e) =>
                          updateAttendee('organization', e.target.value)
                        }
                      />
                    </div>

                    <div className="field" data-field="interest">
                      <label className="field__label" htmlFor="uni-interest">
                        Principal interés al asistir{' '}
                        <span className="field__req">*</span>
                      </label>
                      <select
                        id="uni-interest"
                        value={attendee.interest}
                        onChange={(e) => updateAttendee('interest', e.target.value)}
                      >
                        <option value="">Selecciona una opción…</option>
                        {ATTENDEE_INTERESTS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      {errors.interest && (
                        <p className="field__error">{errors.interest}</p>
                      )}
                    </div>

                    <div className="field" data-field="accompaniedCompetitorId">
                      <label className="field__label" htmlFor="uni-competitor">
                        Emprendedor que acompañan
                      </label>
                      <select
                        id="uni-competitor"
                        value={attendee.accompaniedCompetitorId}
                        onChange={(e) =>
                          updateAttendee('accompaniedCompetitorId', e.target.value)
                        }
                        disabled={competitorsLoading}
                      >
                        <option value="">
                          {competitorsLoading
                            ? 'Cargando emprendedores…'
                            : 'Ninguno'}
                        </option>
                        {competitors.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.full_name}
                            {row.venture_name ? ` — ${row.venture_name}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <fieldset className="field" data-field="referralSource">
                      <legend className="field__label">
                        ¿Cómo se enteró del evento?{' '}
                        <span className="field__req">*</span>
                      </legend>
                      <div className="options">
                        {REFERRAL_SOURCES.map((source) => (
                          <label className="radio" key={source.value}>
                            <input
                              type="radio"
                              name="uniAttReferral"
                              value={source.value}
                              checked={attendee.referralSource === source.value}
                              onChange={(e) =>
                                updateAttendee('referralSource', e.target.value)
                              }
                            />
                            <span>{source.label}</span>
                          </label>
                        ))}
                      </div>
                      {attendee.referralSource === 'other' && (
                        <input
                          type="text"
                          className="field__inline-input"
                          placeholder="¿Cuál?"
                          value={attendee.referralSourceOther}
                          onChange={(e) =>
                            updateAttendee('referralSourceOther', e.target.value)
                          }
                        />
                      )}
                      {errors.referralSource && (
                        <p className="field__error">{errors.referralSource}</p>
                      )}
                      {errors.referralSourceOther && (
                        <p className="field__error">{errors.referralSourceOther}</p>
                      )}
                    </fieldset>
                  </>
                )}

                {(isSponsor || isExhibitor) && (
                  <>
                    <div className="field" data-field="companyName">
                      <label className="field__label" htmlFor="uni-company">
                        Empresa / Marca <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-company"
                        type="text"
                        value={company.companyName}
                        onChange={(e) =>
                          updateCompany('companyName', e.target.value)
                        }
                      />
                      {errors.companyName && (
                        <p className="field__error">{errors.companyName}</p>
                      )}
                    </div>

                    <div className="field" data-field="taxId">
                      <label className="field__label" htmlFor="uni-nit">
                        NIT / Identificación tributaria{' '}
                        <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-nit"
                        type="text"
                        value={company.taxId}
                        onChange={(e) => updateCompany('taxId', e.target.value)}
                      />
                      {errors.taxId && (
                        <p className="field__error">{errors.taxId}</p>
                      )}
                    </div>

                    <div className="field" data-field="contactName">
                      <label className="field__label" htmlFor="uni-contact">
                        Nombre del contacto <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-contact"
                        type="text"
                        value={company.contactName}
                        onChange={(e) =>
                          updateCompany('contactName', e.target.value)
                        }
                      />
                      {errors.contactName && (
                        <p className="field__error">{errors.contactName}</p>
                      )}
                    </div>

                    <div className="field" data-field="contactRole">
                      <label className="field__label" htmlFor="uni-role">
                        Cargo del contacto <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-role"
                        type="text"
                        value={company.contactRole}
                        onChange={(e) =>
                          updateCompany('contactRole', e.target.value)
                        }
                      />
                      {errors.contactRole && (
                        <p className="field__error">{errors.contactRole}</p>
                      )}
                    </div>

                    <div className="field" data-field="email">
                      <label className="field__label" htmlFor="uni-co-email">
                        Correo electrónico <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-co-email"
                        type="email"
                        value={company.email}
                        onChange={(e) => updateCompany('email', e.target.value)}
                      />
                      {errors.email && <p className="field__error">{errors.email}</p>}
                    </div>

                    <div className="field" data-field="phone">
                      <label className="field__label" htmlFor="uni-co-phone">
                        Teléfono / WhatsApp <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-co-phone"
                        type="tel"
                        value={company.phone}
                        onChange={(e) => updateCompany('phone', e.target.value)}
                      />
                      {errors.phone && <p className="field__error">{errors.phone}</p>}
                    </div>

                    <div className="field" data-field="website">
                      <label className="field__label" htmlFor="uni-web">
                        Sitio web / Red social
                      </label>
                      <input
                        id="uni-web"
                        type="text"
                        placeholder="https://…"
                        value={company.website}
                        onChange={(e) => updateCompany('website', e.target.value)}
                      />
                    </div>

                    {isSponsor && (
                      <>
                        <section
                          className="sponsor-plans"
                          aria-labelledby="uni-sponsor-plans-title"
                        >
                          <h3
                            id="uni-sponsor-plans-title"
                            className="sponsor-plans__title"
                          >
                            Planes de vinculación
                          </h3>
                          <div className="sponsor-plans__list">
                            {SPONSOR_PLANS.map((plan) => (
                              <details
                                key={plan.value}
                                className={`sponsor-plans__item ${
                                  company.plan === plan.value ? 'is-selected' : ''
                                }`}
                              >
                                <summary className="sponsor-plans__summary">
                                  <span>{plan.label}</span>
                                  <span className="sponsor-plans__price">
                                    {plan.priceLabel}
                                  </span>
                                </summary>
                                <div className="sponsor-plans__body">
                                  <p className="sponsor-plans__audience">
                                    <strong>Público objetivo:</strong>{' '}
                                    {plan.audience}
                                  </p>
                                  <ul className="sponsor-plans__benefits">
                                    {plan.benefits.map((item) => (
                                      <li key={item}>{item}</li>
                                    ))}
                                  </ul>
                                  {plan.extraBenefits?.length > 0 && (
                                    <ul className="sponsor-plans__benefits">
                                      {plan.extraBenefits.map((item) => (
                                        <li key={item}>{item}</li>
                                      ))}
                                    </ul>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn--outline sponsor-plans__choose"
                                    onClick={() => updateCompany('plan', plan.value)}
                                  >
                                    Elegir {plan.label}
                                  </button>
                                </div>
                              </details>
                            ))}
                          </div>
                        </section>

                        <div className="field" data-field="plan">
                          <label className="field__label" htmlFor="uni-plan">
                            Plan elegido <span className="field__req">*</span>
                          </label>
                          <select
                            id="uni-plan"
                            value={company.plan}
                            onChange={(e) => updateCompany('plan', e.target.value)}
                          >
                            <option value="">Selecciona un plan…</option>
                            {SPONSOR_PLANS.map((plan) => (
                              <option key={plan.value} value={plan.value}>
                                {plan.label} · {plan.priceLabel}
                              </option>
                            ))}
                          </select>
                          {errors.plan && (
                            <p className="field__error">{errors.plan}</p>
                          )}
                        </div>
                      </>
                    )}

                    {isExhibitor && (
                      <div className="field" data-field="standType">
                        <label className="field__label" htmlFor="uni-stand">
                          Tipo de stand <span className="field__req">*</span>
                        </label>
                        <select
                          id="uni-stand"
                          value={company.standType}
                          onChange={(e) =>
                            updateCompany('standType', e.target.value)
                          }
                        >
                          <option value="">Selecciona un stand…</option>
                          {EXHIBITOR_STAND_TYPES.map((stand) => (
                            <option key={stand.value} value={stand.value}>
                              {stand.label}
                            </option>
                          ))}
                        </select>
                        {errors.standType && (
                          <p className="field__error">{errors.standType}</p>
                        )}
                      </div>
                    )}

                    <div className="field" data-field="sector">
                      <label className="field__label" htmlFor="uni-sector">
                        Sector / Industria <span className="field__req">*</span>
                      </label>
                      <input
                        id="uni-sector"
                        type="text"
                        value={company.sector}
                        onChange={(e) => updateCompany('sector', e.target.value)}
                      />
                      {errors.sector && (
                        <p className="field__error">{errors.sector}</p>
                      )}
                    </div>

                    <div className="field" data-field="comments">
                      <label className="field__label" htmlFor="uni-comments">
                        Comentarios
                      </label>
                      <textarea
                        id="uni-comments"
                        rows={3}
                        value={company.comments}
                        onChange={(e) => updateCompany('comments', e.target.value)}
                      />
                    </div>

                    <fieldset className="field" data-field="referralSource">
                      <legend className="field__label">
                        ¿Cómo se enteró del evento?{' '}
                        <span className="field__req">*</span>
                      </legend>
                      <div className="options">
                        {REFERRAL_SOURCES.map((source) => (
                          <label className="radio" key={source.value}>
                            <input
                              type="radio"
                              name="uniCoReferral"
                              value={source.value}
                              checked={company.referralSource === source.value}
                              onChange={(e) =>
                                updateCompany('referralSource', e.target.value)
                              }
                            />
                            <span>{source.label}</span>
                          </label>
                        ))}
                      </div>
                      {company.referralSource === 'other' && (
                        <input
                          type="text"
                          className="field__inline-input"
                          placeholder="¿Cuál?"
                          value={company.referralSourceOther}
                          onChange={(e) =>
                            updateCompany('referralSourceOther', e.target.value)
                          }
                        />
                      )}
                      {errors.referralSource && (
                        <p className="field__error">{errors.referralSource}</p>
                      )}
                      {errors.referralSourceOther && (
                        <p className="field__error">{errors.referralSourceOther}</p>
                      )}
                    </fieldset>
                  </>
                )}

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
                  <button
                    type="submit"
                    className="btn btn--pay-online"
                    disabled={submitting || !wompiReady}
                    title={
                      wompiReady
                        ? UNIFIED_REGISTER.payTitle
                        : 'Pago en línea no configurado'
                    }
                  >
                    {submitting
                      ? UNIFIED_REGISTER.payCtaBusy
                      : wompiReady
                        ? UNIFIED_REGISTER.payCta
                        : UNIFIED_REGISTER.payCtaDisabled}
                  </button>
                </footer>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
