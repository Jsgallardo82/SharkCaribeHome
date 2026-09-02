import { useEffect, useMemo, useState } from 'react'
import {
  SAMPLE_TICKET_GENERAL,
  SAMPLE_TICKET_PREFERENCIAL,
  buildAttendeeTicketEmail,
} from '../lib/attendeeTicketEmail.js'

function openTicketsPrintWindow() {
  const baseUrl = window.location.origin
  const preferencial = buildAttendeeTicketEmail(SAMPLE_TICKET_PREFERENCIAL, {
    baseUrl,
  })
  const general = buildAttendeeTicketEmail(SAMPLE_TICKET_GENERAL, { baseUrl })

  // Escala ~48%: 1 ticket por hoja carta, ~mitad del ancho.
  const PRINT_SCALE = 0.48

  const doc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Tickets Shark Caribe — Preferencial y General</title>
  <style>
    @page { size: letter; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f1f5f9;
      color: #0d1a3d;
      font-family: Segoe UI, Arial, sans-serif;
    }
    .print-label {
      margin: 0 0 6px;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      text-align: center;
    }
    .ticket-page {
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      padding: 12px 0 24px;
      text-align: center;
    }
    .ticket-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .ticket-frame {
      display: inline-block;
      width: ${Math.round(560 * PRINT_SCALE)}px;
      overflow: hidden;
      text-align: left;
      vertical-align: top;
    }
    .ticket-scale {
      width: 560px;
      transform: scale(${PRINT_SCALE});
      transform-origin: top left;
    }
    .ticket-scale > div {
      padding: 8px !important;
      background: transparent !important;
    }
    .ticket-scale > div > div:first-child {
      display: none !important;
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .ticket-page { padding: 0; }
    }
  </style>
</head>
<body>
  <p class="no-print" style="text-align:center;padding:12px;font-size:14px;color:#64748b;">
    Usa “Guardar como PDF” o imprime. Cada ticket va en una página (escala ${Math.round(PRINT_SCALE * 100)}%).
  </p>
  <section class="ticket-page">
    <p class="print-label">Ticket Preferencial · ejemplo</p>
    <div class="ticket-frame">
      <div class="ticket-scale">${preferencial.html}</div>
    </div>
  </section>
  <section class="ticket-page">
    <p class="print-label">Ticket General · ejemplo</p>
    <div class="ticket-frame">
      <div class="ticket-scale">${general.html}</div>
    </div>
  </section>
  <script>
    (async function () {
      const scale = ${PRINT_SCALE}
      const imgs = Array.from(document.images || [])
      await Promise.all(
        imgs.map(function (img) {
          if (img.complete) return Promise.resolve()
          return new Promise(function (resolve) {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )
      document.querySelectorAll('.ticket-frame').forEach(function (frame) {
        var scaleEl = frame.querySelector('.ticket-scale')
        if (!scaleEl) return
        frame.style.height = Math.ceil(scaleEl.scrollHeight * scale) + 'px'
      })
      setTimeout(function () {
        window.focus()
        window.print()
      }, 250)
    })()
  </script>
</body>
</html>`

  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'width=720,height=900')
  if (!win) {
    URL.revokeObjectURL(url)
    window.alert(
      'El navegador bloqueó la ventana emergente. Permite pop-ups para descargar el PDF.'
    )
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Vista previa del HTML del correo-ticket (como lo recibe el comprador).
 * @param {{ attendees?: object[], initialId?: string }} props
 */
export default function AdminTicketPreview({ attendees = [], initialId = '' }) {
  const paid = useMemo(
    () =>
      (Array.isArray(attendees) ? attendees : []).filter(
        (a) => String(a.status || '').toLowerCase() === 'pago'
      ),
    [attendees]
  )

  const [mode, setMode] = useState(
    initialId ? 'real' : 'sample-preferencial'
  )
  const [selectedId, setSelectedId] = useState(initialId || '')

  useEffect(() => {
    if (!initialId) return
    setMode('real')
    setSelectedId(initialId)
  }, [initialId])

  const record = useMemo(() => {
    if (mode === 'sample-preferencial') return SAMPLE_TICKET_PREFERENCIAL
    if (mode === 'sample-general') return SAMPLE_TICKET_GENERAL
    const found = paid.find((a) => a.id === selectedId)
    return found || SAMPLE_TICKET_PREFERENCIAL
  }, [mode, paid, selectedId])

  const preview = useMemo(
    () =>
      buildAttendeeTicketEmail(record, {
        baseUrl:
          typeof window !== 'undefined' ? window.location.origin : '',
      }),
    [record]
  )

  return (
    <div className="admin-ticket-preview">
      <div className="admin-ticket-preview__intro">
        <h2 className="admin-ticket-preview__title">Vista previa de la boleta</h2>
        <p className="admin-ticket-preview__lead">
          Así se ve el correo que recibe el asistente al confirmar el pago (o al
          reenviar el ticket).
        </p>
      </div>

      <div className="admin-ticket-preview__controls">
        <div
          className="admin-ticket-preview__modes"
          role="group"
          aria-label="Tipo de vista"
        >
          <button
            type="button"
            className={`admin__filter ${
              mode === 'sample-preferencial' ? 'is-active' : ''
            }`}
            onClick={() => setMode('sample-preferencial')}
          >
            Ejemplo Preferencial
          </button>
          <button
            type="button"
            className={`admin__filter ${
              mode === 'sample-general' ? 'is-active' : ''
            }`}
            onClick={() => setMode('sample-general')}
          >
            Ejemplo General
          </button>
          <button
            type="button"
            className={`admin__filter ${mode === 'real' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('real')
              if (!selectedId && paid[0]) setSelectedId(paid[0].id)
            }}
            disabled={paid.length === 0}
          >
            Asistente pagado
          </button>
        </div>

        {mode === 'real' && (
          <label className="admin-ticket-preview__select">
            <span>Asistente</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {paid.length === 0 ? (
                <option value="">No hay asistentes en pago</option>
              ) : (
                paid.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.ticket_number ?? '—'} · {a.seat_type || ''} ·{' '}
                    {a.full_name || a.email}
                  </option>
                ))
              )}
            </select>
          </label>
        )}

        <button
          type="button"
          className="btn btn--primary admin-ticket-preview__pdf"
          onClick={openTicketsPrintWindow}
        >
          Descargar PDF (ambos)
        </button>
      </div>

      <p className="admin-ticket-preview__subject">
        <strong>Asunto:</strong> {preview.subject}
      </p>

      <div className="admin-ticket-preview__frame">
        <iframe
          key={`ticket-preview-${mode}-${record.ticket_number ?? 'x'}-${record.seat_type ?? ''}-lux-5`}
          title="Vista previa del correo del ticket"
          className="admin-ticket-preview__iframe"
          srcDoc={preview.html}
          sandbox=""
        />
      </div>
    </div>
  )
}
