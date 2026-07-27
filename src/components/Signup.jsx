import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp, isSupabaseConfigured } from '../lib/supabase.js'
import Ticket, { Barcode } from './Ticket.jsx'
import './Login.css'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // 'session' | 'confirm'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const data = await signUp(email, password)
      if (data.session) {
        navigate('/admin', { replace: true })
        return
      }
      setDone('confirm')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__inner">
        <Ticket className="login__ticket" notchBg="#0b1533">
          <div className="login__main">
            <Barcode variant="dark" className="login__barcode" />
            <p className="login__kicker">Shark Caribe · Administración</p>
            <h1 className="login__title">Crear cuenta</h1>

            {done === 'session' ? (
              <div className="login__signedin">
                <p className="login__muted">
                  ¡Cuenta creada! Ya puedes iniciar sesión.
                </p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => navigate('/login')}
                >
                  Ir a iniciar sesión
                </button>
              </div>
            ) : done === 'confirm' ? (
              <div className="login__signedin">
                <p className="login__muted">
                  Te enviamos un correo para <strong>confirmar tu cuenta</strong>.
                  Revisa tu bandeja de entrada y luego inicia sesión.
                </p>
                <Link to="/login" className="btn btn--primary">
                  Ir a iniciar sesión
                </Link>
              </div>
            ) : (
              <form className="login__form" onSubmit={handleSubmit}>
                {!isSupabaseConfigured && (
                  <p className="login__warn">
                    Falta configurar Supabase (.env.local). El registro no
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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                <label className="login__field">
                  <span>Confirmar contraseña</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>

                {error && <p className="login__error">{error}</p>}

                <button
                  type="submit"
                  className="btn btn--primary login__submit"
                  disabled={loading}
                >
                  {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>

                <p className="login__alt">
                  ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
              </form>
            )}
          </div>
        </Ticket>

        <button
          type="button"
          className="login__back"
          onClick={() => navigate('/')}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  )
}
