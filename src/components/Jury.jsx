import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSession,
  getProfile,
  ensureProfile,
  signOut,
  displayNameFromSession,
  homePathForRole,
  supabase,
} from '../lib/supabase.js'
import { JURY_PORTAL, USER_ROLES } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import Footer from './Footer.jsx'
import Juicio2Ronda from './Juicio2Ronda.jsx'
import './Jury.css'

export default function Jury() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const session = await getSession()
        if (cancelled) return

        if (!session) {
          navigate('/login', { replace: true })
          return
        }

        await ensureProfile()
        if (cancelled) return

        const profile = await getProfile()
        if (cancelled) return

        if (!profile || profile.role !== USER_ROLES.jurado) {
          const path = homePathForRole(profile?.role)
          if (path !== '/jurado') {
            navigate(path, { replace: true })
            return
          }
          setStatus('forbidden')
          return
        }

        setDisplayName(displayNameFromSession(session, profile))
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'No pudimos cargar el panel del jurado.')
        setStatus('error')
      }
    }

    load()

    const { data: authSub } = supabase?.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login', { replace: true })
      }
    }) || { data: null }

    return () => {
      cancelled = true
      authSub?.subscription?.unsubscribe?.()
    }
  }, [navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  /* Mientras verifica sesión no mostramos el panel (vista protegida). */
  if (status === 'loading') {
    return (
      <div className="jury jury--gate">
        <p className="jury__muted">Verificando sesión…</p>
      </div>
    )
  }

  if (status === 'forbidden' || status === 'error') {
    return (
      <div className="jury jury--gate">
        <button
          type="button"
          className="jury__signout-top"
          onClick={handleSignOut}
        >
          Cerrar sesión
        </button>
        <div className="jury__inner">
          <Ticket className="jury__ticket" notchBg="#0b1533">
            <div className="jury__main">
              <p className="jury__error">
                {status === 'forbidden'
                  ? 'Esta cuenta no tiene rol de jurado.'
                  : error}
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate('/login', { replace: true })}
              >
                Ir al login
              </button>
            </div>
          </Ticket>
        </div>
      </div>
    )
  }

  return (
    <div className="jury">
      <button
        type="button"
        className="jury__signout-top"
        onClick={handleSignOut}
      >
        Cerrar sesión
      </button>

      <div className="jury__content">
        <div className="jury__welcome">
          <Ticket className="jury__ticket" notchBg="#0b1533">
            <div className="jury__main">
              <Barcode variant="dark" className="jury__barcode" />
              <p className="jury__kicker">{JURY_PORTAL.competitionTitle}</p>
              <p className="jury__role">{JURY_PORTAL.roleLabel}</p>
              <h1 className="jury__name">{displayName}</h1>
              <p className="jury__hint">Bienvenido al panel del jurado.</p>
            </div>
          </Ticket>
        </div>

        <Juicio2Ronda />
      </div>

      <Footer />
    </div>
  )
}
