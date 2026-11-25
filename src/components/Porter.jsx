import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSession,
  getProfile,
  ensureProfile,
  signOut,
  displayNameFromSession,
  homePathForRole,
  supabase,
  fetchEventGuests,
  setAttendeeCheckedIn,
} from '../lib/supabase.js'
import { USER_ROLES, ATTENDEE_SEAT_TYPES } from '../data/content.js'
import Ticket, { Barcode } from './Ticket.jsx'
import AdminCheckIn from './AdminCheckIn.jsx'
import './Jury.css'
import './Admin.css'
import './Porter.css'

function seatLabel(value) {
  return ATTENDEE_SEAT_TYPES.find((item) => item.value === value)?.label || value || '—'
}

function fold(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Porter() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [guests, setGuests] = useState([])
  const [listError, setListError] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [seatFilter, setSeatFilter] = useState('all')
  const [scannerOpen, setScannerOpen] = useState(true)
  const [accessBusyId, setAccessBusyId] = useState('')
  const [accessError, setAccessError] = useState('')

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

        const role = profile?.role
        if (role !== USER_ROLES.portero && role !== USER_ROLES.admin) {
          navigate(homePathForRole(role), { replace: true })
          return
        }

        setDisplayName(displayNameFromSession(session, profile))
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'No pudimos abrir el acceso.')
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

  async function loadGuests() {
    setListLoading(true)
    setListError('')
    try {
      const rows = await fetchEventGuests()
      setGuests(rows)
    } catch (err) {
      setListError(err?.message || 'No pudimos cargar la lista.')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'ready') return undefined
    loadGuests()
    return undefined
  }, [status])

  const bySeat = useMemo(() => {
    if (seatFilter === 'all') return guests
    return guests.filter((guest) => guest.seat_type === seatFilter)
  }, [guests, seatFilter])

  const counts = useMemo(() => {
    const inside = bySeat.filter((guest) => guest.checked_in_at).length
    return { total: bySeat.length, inside, waiting: bySeat.length - inside }
  }, [bySeat])

  const visible = useMemo(() => {
    const needle = fold(query.trim())
    return bySeat.filter((guest) => {
      if (filter === 'in' && !guest.checked_in_at) return false
      if (filter === 'out' && guest.checked_in_at) return false
      if (!needle) return true
      const haystack = fold(
        [
          guest.full_name,
          guest.email,
          guest.document_number,
          guest.phone,
          guest.ticket_number,
          seatLabel(guest.seat_type),
        ].join(' ')
      )
      return haystack.includes(needle)
    })
  }, [bySeat, query, filter])

  const grantAccess = async (guest) => {
    if (!guest?.id || guest.checked_in_at || accessBusyId) return
    setAccessBusyId(guest.id)
    setAccessError('')
    try {
      const data = await setAttendeeCheckedIn(guest.id, true)
      handleCheckedIn(data)
    } catch (err) {
      setAccessError(err?.message || 'No pudimos marcar el ingreso.')
    } finally {
      setAccessBusyId('')
    }
  }

  const handleCheckedIn = (payload) => {
    if (!payload?.id) return
    setGuests((current) =>
      current.map((guest) =>
        guest.id === payload.id
          ? { ...guest, checked_in_at: payload.checked_in_at || guest.checked_in_at }
          : guest
      )
    )
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (status === 'loading') {
    return (
      <div className="jury jury--gate">
        <p className="jury__muted">Verificando sesión…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="jury jury--gate">
        <div className="jury__inner">
          <Ticket className="jury__ticket" notchBg="#0b1533">
            <div className="jury__main">
              <p className="jury__error">{error}</p>
              <button type="button" className="btn btn--primary" onClick={handleSignOut}>
                Cerrar sesión
              </button>
            </div>
          </Ticket>
        </div>
      </div>
    )
  }

  return (
    <div className="jury porter">
      <button type="button" className="jury__signout-top" onClick={handleSignOut}>
        Cerrar sesión
      </button>

      <div className="jury__content porter__content">
        <div className="jury__welcome">
          <Ticket className="jury__ticket" notchBg="#0b1533">
            <div className="jury__main">
              <Barcode variant="dark" className="jury__barcode" />
              <p className="jury__kicker">Shark Caribe · Entrada</p>
              <p className="jury__role">Portero</p>
              <h1 className="jury__name">{displayName}</h1>
            </div>
          </Ticket>
        </div>

        <section className={`porter-scan${scannerOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className="porter-scan__toggle"
            aria-expanded={scannerOpen}
            onClick={() => setScannerOpen((open) => !open)}
          >
            <span>Escáner QR</span>
            <strong>{scannerOpen ? 'Encoger' : 'Abrir'}</strong>
          </button>
          {scannerOpen ? <AdminCheckIn onCheckedIn={handleCheckedIn} /> : null}
        </section>

        <section className="porter-list" aria-label="Lista de invitados">
          <header className="porter-list__head">
            <h2>Invitados</h2>
            <p>
              {counts.inside} adentro · {counts.waiting} por entrar · {counts.total} con boleta
            </p>
          </header>

          <div className="porter-list__tools">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nombre, correo, documento o boleta"
              aria-label="Buscar invitado"
            />
            <div className="porter-list__filters" role="group" aria-label="Filtrar tipo de boleta">
              <button
                type="button"
                className={seatFilter === 'all' ? 'is-active' : ''}
                aria-pressed={seatFilter === 'all'}
                onClick={() => setSeatFilter('all')}
              >
                Todas
              </button>
              {ATTENDEE_SEAT_TYPES.map((seat) => (
                <button
                  key={seat.value}
                  type="button"
                  className={seatFilter === seat.value ? 'is-active' : ''}
                  aria-pressed={seatFilter === seat.value}
                  onClick={() => setSeatFilter(seat.value)}
                >
                  {seat.label}
                </button>
              ))}
            </div>
            <div className="porter-list__filters" role="group" aria-label="Filtrar ingreso">
              {[
                ['all', 'Todos'],
                ['out', 'Por entrar'],
                ['in', 'Adentro'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={filter === id ? 'is-active' : ''}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {listLoading ? <p className="porter-list__status">Cargando invitados…</p> : null}
          {listError ? <p className="porter-list__error">{listError}</p> : null}
          {accessError ? <p className="porter-list__error">{accessError}</p> : null}

          {!listLoading && !listError && visible.length === 0 ? (
            <p className="porter-list__status">Nadie coincide con esa búsqueda.</p>
          ) : null}

          <ul className="porter-list__items">
            {visible.map((guest) => {
              const inside = Boolean(guest.checked_in_at)
              return (
                <li key={guest.id} className={inside ? 'is-in' : ''}>
                  <div>
                    <strong>{guest.full_name || 'Sin nombre'}</strong>
                    {guest.email ? <span>{guest.email}</span> : null}
                  </div>
                  <div className="porter-list__meta">
                    <span>#{guest.ticket_number ?? '—'}</span>
                    <span>{seatLabel(guest.seat_type)}</span>
                    <em>{inside ? `Adentro ${formatWhen(guest.checked_in_at)}` : 'Por entrar'}</em>
                    {inside ? null : (
                      <button
                        type="button"
                        className="porter-list__grant"
                        disabled={accessBusyId === guest.id}
                        onClick={() => grantAccess(guest)}
                      >
                        {accessBusyId === guest.id ? 'Marcando…' : 'Dar acceso'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
