import { useEffect, useRef, useState } from 'react'
import { SPONSOR_BADGES, SPONSOR_PLANS } from '../data/content.js'
import './Sponsors.css'

function planForBadge(badgeId) {
  return SPONSOR_PLANS.find((plan) => plan.value === badgeId) || null
}

export default function Sponsors({ onRegister }) {
  const [openId, setOpenId] = useState(null)
  const badgesRef = useRef(null)

  useEffect(() => {
    if (!openId) return undefined

    function onPointerDown(event) {
      if (!badgesRef.current?.contains(event.target)) {
        setOpenId(null)
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpenId(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openId])

  return (
    <section id="patrocinadores" className="sponsors">
      <div className="sponsors__overlay" aria-hidden="true" />
      <div className="container sponsors__shell">
        <div className="sponsors__inner">
          <div className="sponsors__mascot">
            <img src="/sharkycolor.png" alt="Sharky, la mascota de Shark Caribe" />
          </div>
          <div className="sponsors__content">
            <p className="sponsors__kicker">Patrocinios</p>
            <h2 className="sponsors__title">
              Lleva tu marca al escenario de Shark Caribe Pitch Competition
            </h2>
            <p className="sponsors__text">
              Conecta con emprendedores, empresarios e inversionistas del Caribe.
              Sé parte de la cuarta edición como patrocinador.
            </p>
            <button
              type="button"
              className="btn btn--primary sponsors__cta"
              onClick={() => onRegister?.('patrocinador')}
            >
              Inscríbete como patrocinador
            </button>
          </div>
        </div>

        <ul
          className="sponsors__badges"
          ref={badgesRef}
          aria-label="Planes de patrocinio"
        >
          {SPONSOR_BADGES.map((badge) => {
            const plan = planForBadge(badge.id)
            const isOpen = openId === badge.id

            return (
              <li key={badge.id} className="sponsors__badge-item">
                <button
                  type="button"
                  className={`sponsors__badge sponsors__badge--${badge.id} ${
                    isOpen ? 'is-open' : ''
                  }`}
                  aria-expanded={isOpen}
                  aria-controls={`sponsor-balloon-${badge.id}`}
                  onClick={() =>
                    setOpenId((prev) => (prev === badge.id ? null : badge.id))
                  }
                >
                  {badge.label}
                </button>

                {isOpen && plan && (
                  <div
                    id={`sponsor-balloon-${badge.id}`}
                    className="sponsors__balloon"
                    role="dialog"
                    aria-label={`Beneficios de ${plan.label}`}
                  >
                    <p className="sponsors__balloon-audience">{plan.audience}</p>
                    <p className="sponsors__balloon-label">Beneficios</p>
                    <ul className="sponsors__balloon-list">
                      {plan.benefits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    {plan.extraBenefits?.length > 0 && (
                      <>
                        <p className="sponsors__balloon-label">
                          Beneficios adicionales
                        </p>
                        <ul className="sponsors__balloon-list">
                          {plan.extraBenefits.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn--primary sponsors__balloon-cta"
                      onClick={() => {
                        setOpenId(null)
                        onRegister?.('patrocinador')
                      }}
                    >
                      Inscribirme
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
