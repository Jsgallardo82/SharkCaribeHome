import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

  /* En móvil: globo fixed al viewport. En desktop: desplaza si se sale del borde. */
  useLayoutEffect(() => {
    if (!openId) return undefined

    const balloon = document.getElementById(`sponsor-balloon-${openId}`)
    const trigger = document.querySelector(
      `[aria-controls="sponsor-balloon-${openId}"]`
    )
    if (!balloon || !trigger) return undefined

    const pad = 12
    const mobileMq = window.matchMedia('(max-width: 760px)')

    function clearInline() {
      balloon.style.position = ''
      balloon.style.left = ''
      balloon.style.right = ''
      balloon.style.top = ''
      balloon.style.bottom = ''
      balloon.style.width = ''
      balloon.style.maxWidth = ''
      balloon.style.transform = ''
      balloon.style.setProperty('--balloon-shift', '0px')
      balloon.dataset.placement = 'above'
    }

    function placeMobile() {
      const br = trigger.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      balloon.style.position = 'fixed'
      balloon.style.left = `${pad}px`
      balloon.style.right = `${pad}px`
      balloon.style.width = 'auto'
      balloon.style.maxWidth = `${vw - pad * 2}px`
      balloon.style.transform = 'none'
      balloon.style.setProperty('--balloon-shift', '0px')
      balloon.style.bottom = 'auto'
      balloon.style.top = '0px'
      balloon.dataset.placement = 'above'

      const height = balloon.getBoundingClientRect().height
      let top = br.top - height - 10
      let placement = 'above'

      if (top < pad) {
        top = br.bottom + 10
        placement = 'below'
      }
      if (top + height > vh - pad) {
        top = Math.max(pad, vh - pad - height)
      }

      balloon.dataset.placement = placement
      balloon.style.top = `${Math.round(top)}px`
    }

    function placeDesktop() {
      clearInline()
      balloon.dataset.placement = 'above'

      const rect = balloon.getBoundingClientRect()
      const vw = window.innerWidth
      let shift = 0
      if (rect.left < pad) shift = pad - rect.left
      else if (rect.right > vw - pad) shift = vw - pad - rect.right
      balloon.style.setProperty('--balloon-shift', `${Math.round(shift)}px`)

      const after = balloon.getBoundingClientRect()
      if (after.top < pad) {
        balloon.dataset.placement = 'below'
      }
    }

    function place() {
      if (mobileMq.matches) placeMobile()
      else placeDesktop()
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    mobileMq.addEventListener('change', place)
    return () => {
      clearInline()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      mobileMq.removeEventListener('change', place)
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
