import { useEffect, useRef, useState } from 'react'
import { PRIZES } from '../data/content.js'
import { sharkySoundInteractionProps } from '../lib/sharkySound.js'
import './Prizes.css'

const FLOAT_EMOJIS = ['🏆', '💰', '✨', '🥇', '🎉', '🦈']

export default function Prizes() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(node)

    /* Si el observer no dispara (HMR / viewport raro), muestra igual */
    const fallback = window.setTimeout(() => setVisible(true), 900)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])

  const orderedPodium = [
    PRIZES.podium[1],
    PRIZES.podium[0],
    PRIZES.podium[2],
  ]

  return (
    <section
      id="premios"
      ref={sectionRef}
      className={`prizes ${visible ? 'is-visible' : ''}`}
    >
      <div className="prizes__glow" aria-hidden="true" />
      <div className="prizes__sparkles" aria-hidden="true" />

      <div className="prizes__floats" aria-hidden="true">
        {FLOAT_EMOJIS.map((emoji, i) => (
          <span
            key={`${emoji}-${i}`}
            className={`prizes__float prizes__float--${i + 1}`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="container prizes__inner">
        <header className="prizes__header">
          <p className="prizes__eyebrow">
            <span aria-hidden="true">🏆</span> {PRIZES.eyebrow}
          </p>
          <p className="prizes__date">
            <span aria-hidden="true">📅</span> {PRIZES.dateLabel}
          </p>
        </header>

        <div className="prizes__hero">
          <div className="prizes__hero-copy">
            <div className="prizes__badge">
              <span className="prizes__badge-pulse" aria-hidden="true" />
              <span className="prizes__badge-text">
                🎯 {PRIZES.badge}
              </span>
            </div>
            <h2 className="prizes__title">{PRIZES.title}</h2>
            <p className="prizes__lead">
              La noche donde el Caribe corona a sus emprendedores.
            </p>
          </div>
          <div className="prizes__hero-art">
            <img
              src={PRIZES.sharky}
              alt="Sharky, mascota de Shark Caribe"
              className="prizes__sharky"
              {...sharkySoundInteractionProps()}
            />
          </div>
        </div>

        <div className="prizes__podium" aria-label="Premios en efectivo">
          {orderedPodium.map((prize, i) => (
            <article
              key={prize.place}
              className={`prizes__place prizes__place--${prize.tier}`}
              style={{ '--place-i': i }}
            >
              <span className="prizes__place-emoji" aria-hidden="true">
                {prize.emoji}
              </span>
              <p className="prizes__place-label">{prize.place}</p>
              <p className="prizes__place-amount">{prize.amount}</p>
              <p className="prizes__place-detail">{prize.detail}</p>
            </article>
          ))}
        </div>

        <p className="prizes__allies">
          <span aria-hidden="true">🎁</span> {PRIZES.alliesNote}
        </p>

        <div className="prizes__mentions">
          <h3 className="prizes__mentions-title">
            <span aria-hidden="true">✨</span> {PRIZES.mentionsTitle}
          </h3>
          <ul className="prizes__mentions-list">
            {PRIZES.mentions.map((item, i) => (
              <li
                key={item.label}
                className="prizes__mention"
                style={{ '--mention-i': i }}
              >
                <span aria-hidden="true">{item.emoji}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
