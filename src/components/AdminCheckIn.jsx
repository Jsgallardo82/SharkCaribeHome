import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  checkInAttendeeByToken,
  extractTicketToken,
} from '../lib/supabase.js'
import { ATTENDEE_SEAT_TYPES } from '../data/content.js'

function seatLabel(value) {
  const found = ATTENDEE_SEAT_TYPES.find((s) => s.value === value)
  return found ? found.label : value || '—'
}

function formatWhen(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('es-CO')
}

/**
 * @param {{ onCheckedIn?: (payload: object) => void }} props
 */
export default function AdminCheckIn({ onCheckedIn }) {
  const [manual, setManual] = useState('')
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const scannerRef = useRef(null)
  const lastScanRef = useRef('')
  const modalOpenRef = useRef(false)
  const readerId = 'admin-qr-reader'

  useEffect(() => {
    modalOpenRef.current = Boolean(modal)
  }, [modal])

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      scannerRef.current = null
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear()
            } catch {
              /* ignore */
            }
          })
      }
    }
  }, [])

  const closeModal = () => {
    setModal(null)
    lastScanRef.current = ''
  }

  const applyResult = (data) => {
    setResult(data)
    setModal({
      kind: data.already ? 'already' : 'ok',
      title: data.already ? 'Ya había ingresado' : 'Ingreso registrado',
      name: data.full_name || 'Asistente',
      meta: `Ticket #${data.ticket_number ?? '—'} · ${seatLabel(data.seat_type)}`,
      time: data.checked_in_at ? formatWhen(data.checked_in_at) : '',
    })
    if (data?.ok && data.id) {
      onCheckedIn?.(data)
    }
  }

  const processToken = async (raw) => {
    if (modalOpenRef.current) return

    const rawText = String(raw || '').trim()
    const token = extractTicketToken(rawText)
    if (!token) {
      const msg = rawText
        ? `No reconocimos un código de ticket válido. Leído: “${rawText.slice(0, 80)}${rawText.length > 80 ? '…' : ''}”`
        : 'No reconocimos un código de ticket válido.'
      setError(msg)
      setModal({ kind: 'error', title: 'QR no válido', message: msg })
      return
    }
    if (busy) return
    if (lastScanRef.current === token && result?.ok) return

    setBusy(true)
    setError('')
    try {
      const data = await checkInAttendeeByToken(token)
      lastScanRef.current = token
      if (!data?.ok) {
        const map = {
          not_found: 'Ticket no encontrado.',
          not_paid: 'Este registro no tiene pago confirmado.',
          missing_token: 'Código vacío.',
          forbidden: 'Sin permiso de administrador.',
        }
        const detail =
          data?.error === 'not_found' ? ` Token leído: ${token}` : ''
        const msg =
          (map[data?.error] || data?.error || 'No se pudo validar.') + detail
        setError(msg)
        setResult(data || null)
        setModal({
          kind: 'error',
          title: 'No se pudo validar',
          message: msg,
        })
        return
      }
      applyResult(data)
    } catch (err) {
      const msg = err?.message || 'Error al validar el ticket.'
      setError(msg)
      setResult(null)
      setModal({ kind: 'error', title: 'Error', message: msg })
    } finally {
      setBusy(false)
    }
  }

  const startScanner = async () => {
    setError('')
    setResult(null)
    setModal(null)
    try {
      const scanner = new Html5Qrcode(readerId)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          processToken(decoded)
        },
        () => {}
      )
      setScanning(true)
    } catch (err) {
      setScanning(false)
      scannerRef.current = null
      setError(
        err?.message ||
          'No pudimos abrir la cámara. Usa el ingreso manual o permite el acceso a la cámara.'
      )
    }
  }

  const stopScanner = async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    setScanning(false)
    if (!scanner) return
    try {
      await scanner.stop()
      scanner.clear()
    } catch {
      /* ignore */
    }
  }

  const onManualSubmit = (e) => {
    e.preventDefault()
    processToken(manual)
  }

  return (
    <div className="admin-checkin">
      <div className="admin-checkin__intro">
        <h2 className="admin-checkin__title">Acceso al evento</h2>
        <p className="admin-checkin__lead">
          Escanea el QR del correo del asistente o pega el código del ticket
          para marcar el ingreso.
        </p>
      </div>

      <div className="admin-checkin__grid">
        <section className="admin-checkin__panel" aria-label="Escáner QR">
          <div id={readerId} className="admin-checkin__reader" />
          <div className="admin-checkin__scan-actions">
            {!scanning ? (
              <button
                type="button"
                className="btn admin-btn admin-btn--green"
                onClick={startScanner}
                disabled={busy}
              >
                Abrir cámara
              </button>
            ) : (
              <button
                type="button"
                className="btn admin-btn admin-btn--yellow"
                onClick={stopScanner}
              >
                Detener cámara
              </button>
            )}
          </div>
        </section>

        <section className="admin-checkin__panel" aria-label="Ingreso manual">
          <form className="admin-checkin__manual" onSubmit={onManualSubmit}>
            <label className="admin-checkin__label" htmlFor="admin-manual-token">
              Código del ticket (UUID del QR)
            </label>
            <input
              id="admin-manual-token"
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Pega el token del QR"
              autoComplete="off"
              disabled={busy}
            />
            <button
              type="submit"
              className="btn admin-btn admin-btn--blue"
              disabled={busy || !manual.trim()}
            >
              {busy ? 'Validando…' : 'Marcar ingreso'}
            </button>
          </form>

          {error && !modal && <p className="admin-checkin__error">{error}</p>}

          {result?.ok && !modal && (
            <div
              className={`admin-checkin__result ${
                result.already ? 'is-already' : 'is-ok'
              }`}
            >
              <p className="admin-checkin__result-kicker">
                {result.already ? 'Ya había ingresado' : 'Ingreso registrado'}
              </p>
              <p className="admin-checkin__result-name">{result.full_name}</p>
              <p className="admin-checkin__result-meta">
                Ticket #{result.ticket_number ?? '—'} ·{' '}
                {seatLabel(result.seat_type)}
              </p>
              {result.checked_in_at && (
                <p className="admin-checkin__result-time">
                  {formatWhen(result.checked_in_at)}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {modal && (
        <div
          className="admin-checkin-modal__backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            className={`admin-checkin-modal admin-checkin-modal--${modal.kind}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-checkin-modal-title"
          >
            <p
              id="admin-checkin-modal-title"
              className="admin-checkin-modal__title"
            >
              {modal.title}
            </p>
            {modal.name ? (
              <p className="admin-checkin-modal__name">{modal.name}</p>
            ) : null}
            {modal.meta ? (
              <p className="admin-checkin-modal__meta">{modal.meta}</p>
            ) : null}
            {modal.time ? (
              <p className="admin-checkin-modal__time">{modal.time}</p>
            ) : null}
            {modal.message ? (
              <p className="admin-checkin-modal__message">{modal.message}</p>
            ) : null}
            <button
              type="button"
              className="btn admin-btn admin-btn--green admin-checkin-modal__ok"
              onClick={closeModal}
              autoFocus
            >
              Continuar escaneando
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
