import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signIn,
  getSession,
  getProfile,
  ensureProfile,
  homePathForRole,
  isSupabaseConfigured,
} from '../lib/supabase.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  async function redirectByRole() {
    await ensureProfile()
    const profile = await getProfile()
    navigate(homePathForRole(profile?.role), { replace: true })
  }

  /* Si ya hay sesión activa, vamos al panel correspondiente. */
  useEffect(() => {
    let active = true
    getSession()
      .then(async (s) => {
        if (!active) return
        if (s) {
          try {
            await redirectByRole()
          } catch {
            if (active) navigate('/admin', { replace: true })
          }
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        if (active) setChecking(false)
      })
    return () => {
      active = false
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      await redirectByRole()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__inner">
        <Ticket className="login__ticket" notchBg="#0b1533">
          <div className="login__main">
            <Barcode variant="dark" className="login__barcode" />
            <p className="login__kicker">Shark Caribe · Acceso</p>
            <h1 className="login__title">Iniciar sesión</h1>

            {checking ? (
              <p className="login__muted">Cargando…</p>
            ) : (
              <form className="login__form" onSubmit={handleSubmit}>
                {!isSupabaseConfigured && (
                  <p className="login__warn">
                    Falta configurar Supabase (.env.local). El inicio de sesión no
                    funcionará hasta configurarlo.
                  </p>
                )}

                <label className="login__field">
                  <span>Correo</span>
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="login__field">
                  <span>Contraseña</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                {error && <p className="login__error">{error}</p>}

                <button
                  type="submit"
                  className="btn btn--primary login__submit"
                  disabled={loading}
                >
                  {loading ? 'Ingresando…' : 'Ingresar'}
                </button>
              </form>
            )}
          </div>
        </Ticket>

        <button
          type="button"
          className="login__back"
          onClick={() => navigate('/')}
        >
          ← Volver al sitio
        </button>
      </div>
    </div>
  )
}
