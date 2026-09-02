import { useEffect, useMemo, useState } from 'react'
import {
  SAMPLE_TICKET_GENERAL,
  SAMPLE_TICKET_PREFERENCIAL,
  buildAttendeeTicketEmail,
} from '../lib/attendeeTicketEmail.js'

/** Escala según boletas por hoja (carta). Más densas = QR más chico. */
const SCALE_BY_PER_PAGE = {
  1: 0.48,
  2: 0.4,
  4: 0.3,
}

function isPhysicalInventoryTicket(row) {
  const conf = String(row?.payment_confirmation || '')
  const doc = String(row?.document_number || '')
  return (
    conf === 'FISICO:INVENTARIO' ||
    doc.startsWith('FIS-PREF-') ||
    doc.startsWith('FIS-GEN-')
  )
}

function chunkTickets(items, size) {
  const sheets = []
  for (let i = 0; i < items.length; i += size) {
    sheets.push(items.slice(i, i + size))
  }
  return sheets
}

/**
 * @param {Array<{ label: string, html: string }>} tickets
 * @param {string} title
 * @param {1|2|4} [ticketsPerPage]
 */
function openPrintWindow(tickets, title, ticketsPerPage = 1) {
  if (!tickets.length) {
    window.alert('No hay boletas para imprimir.')
    return
  }

  const perPage = [1, 2, 4].includes(Number(ticketsPerPage))
    ? Number(ticketsPerPage)
    : 1
  const scale = SCALE_BY_PER_PAGE[perPage] || SCALE_BY_PER_PAGE[1]
  const frameW = Math.round(560 * scale)
  const sheets = chunkTickets(tickets, perPage)
  const layoutClass =
    perPage === 4 ? 'sheet--grid4' : perPage === 2 ? 'sheet--stack2' : 'sheet--one'

  const sheetHtml = sheets
    .map((sheet) => {
      const cells = sheet
        .map(
          (ticket) => `
      <div class="ticket-cell">
        <p class="print-label">${ticket.label}</p>
        <div class="ticket-frame">
          <div class="ticket-scale">${ticket.html}</div>
        </div>
      </div>`
        )
        .join('\n')
      return `
  <section class="sheet ${layoutClass}">
    ${cells}
  </section>`
    })
    .join('\n')

  const doc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: letter; margin: 8mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f1f5f9;
      color: #0d1a3d;
      font-family: Segoe UI, Arial, sans-serif;
    }
    .print-label {
      margin: 0 0 4px;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      text-align: center;
    }
    .sheet {
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      padding: 6px 0 10px;
      width: 100%;
    }
    .sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .sheet--one {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .sheet--stack2 {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
      gap: 8px;
      min-height: 250mm;
    }
    .sheet--grid4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 6px 8px;
      align-items: start;
      justify-items: center;
      min-height: 250mm;
    }
    .ticket-cell {
      text-align: center;
    }
    .ticket-frame {
      display: inline-block;
      width: ${frameW}px;
      overflow: hidden;
      text-align: left;
      vertical-align: top;
    }
    .ticket-scale {
      width: 560px;
      transform: scale(${scale});
      transform-origin: top left;
    }
    .ticket-scale > div {
      padding: 6px !important;
      background: transparent !important;
    }
    .ticket-scale > div > div:first-child {
      display: none !important;
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .sheet { padding: 0; }
      .sheet--stack2, .sheet--grid4 { min-height: 0; height: 260mm; }
    }
  </style>
</head>
<body>
  <p class="no-print" style="text-align:center;padding:12px;font-size:14px;color:#64748b;max-width:40rem;margin:0 auto;">
    ${tickets.length} boleta(s) · ${perPage} por hoja · ${sheets.length} página(s).
    Usa “Guardar como PDF”. Espera a que carguen los QR.
    ${perPage === 4 ? ' Aviso: con 4 por hoja el QR queda más chico; prueba escanear una muestra.' : ''}
  </p>
  ${sheetHtml}
  <script>
    (async function () {
      const scale = ${scale}
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
      }, 450)
    })()
  </script>
</body>
</html>`

  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'width=780,height=920')
  if (!win) {
    URL.revokeObjectURL(url)
    window.alert(
      'El navegador bloqueó la ventana emergente. Permite pop-ups para descargar el PDF.'
    )
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), 180_000)
}

function openTicketsPrintWindow() {
  const baseUrl = window.location.origin
  const preferencial = buildAttendeeTicketEmail(SAMPLE_TICKET_PREFERENCIAL, {
    baseUrl,
  })
  const general = buildAttendeeTicketEmail(SAMPLE_TICKET_GENERAL, { baseUrl })
  openPrintWindow(
    [
      { label: 'Ticket Preferencial · ejemplo', html: preferencial.html },
      { label: 'Ticket General · ejemplo', html: general.html },
    ],
    'Tickets Shark Caribe — Preferencial y General',
    1
  )
}

function openInventoryPrintWindow(records, seatLabel, ticketsPerPage) {
  const baseUrl = window.location.origin
  const sorted = [...records].sort((a, b) => {
    const na = Number(a.ticket_number) || 0
    const nb = Number(b.ticket_number) || 0
    if (na !== nb) return na - nb
    return String(a.document_number || '').localeCompare(
      String(b.document_number || '')
    )
  })

  const tickets = sorted.map((row) => {
    const built = buildAttendeeTicketEmail(row, { baseUrl })
    const num = row.ticket_number != null ? `#${row.ticket_number}` : '—'
    const docNo = row.document_number || ''
    return {
      label: `${seatLabel} · ticket ${num} · ${docNo}`,
      html: built.html,
    }
  })

  const sheets = Math.ceil(tickets.length / ticketsPerPage)
  openPrintWindow(
    tickets,
    `Inventario físico · ${seatLabel} · ${tickets.length} boletas · ${ticketsPerPage}/hoja`,
    ticketsPerPage
  )
  return sheets
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

  const physicalPref = useMemo(
    () =>
      paid.filter(
        (a) =>
          isPhysicalInventoryTicket(a) &&
          String(a.seat_type || '') === 'preferencial'
      ),
    [paid]
  )
  const physicalGen = useMemo(
    () =>
      paid.filter(
        (a) =>
          isPhysicalInventoryTicket(a) &&
          String(a.seat_type || '') === 'general'
      ),
    [paid]
  )

  const [mode, setMode] = useState(
    initialId ? 'real' : 'sample-preferencial'
  )
  const [selectedId, setSelectedId] = useState(initialId || '')
  const [busyPrint, setBusyPrint] = useState('')
  const [ticketsPerPage, setTicketsPerPage] = useState(2)

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

  function handleInventoryPrint(kind) {
    const rows = kind === 'preferencial' ? physicalPref : physicalGen
    const label = kind === 'preferencial' ? 'Preferencial' : 'General'
    if (!rows.length) {
      window.alert(
        `No hay boletas físicas ${label} en la base. Ejecuta physical_ticket_inventory.sql primero.`
      )
      return
    }
    const sheets = Math.ceil(rows.length / ticketsPerPage)
    const ok = window.confirm(
      `Se abrirá una ventana con ${rows.length} boletas ${label}\n` +
        `(${ticketsPerPage} por hoja ≈ ${sheets} páginas).\n` +
        'Luego elige “Guardar como PDF”.\n\n' +
        '¿Continuar?'
    )
    if (!ok) return
    setBusyPrint(kind)
    try {
      openInventoryPrintWindow(rows, label, ticketsPerPage)
    } finally {
      setTimeout(() => setBusyPrint(''), 800)
    }
  }

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

      <div className="admin-ticket-preview__inventory">
        <h3 className="admin-ticket-preview__inventory-title">
          Inventario físico para imprenta
        </h3>
        <p className="admin-ticket-preview__inventory-lead">
          Genera PDF con QR reales. Recomendado: <strong>2 por hoja</strong>{' '}
          (ahorra papel y el QR sigue legible). Con 4 por hoja prueba escanear
          una muestra antes de mandar a imprenta.
        </p>
        <label className="admin-ticket-preview__select admin-ticket-preview__per-page">
          <span>Boletas por hoja</span>
          <select
            value={ticketsPerPage}
            onChange={(e) => setTicketsPerPage(Number(e.target.value))}
          >
            <option value={1}>1 por hoja (~100 páginas / tipo)</option>
            <option value={2}>2 por hoja (~50 páginas / tipo) · recomendado</option>
            <option value={4}>4 por hoja (~25 páginas / tipo)</option>
          </select>
        </label>
        <div className="admin-ticket-preview__inventory-actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={busyPrint === 'preferencial' || physicalPref.length === 0}
            onClick={() => handleInventoryPrint('preferencial')}
          >
            PDF Preferencial ({physicalPref.length})
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busyPrint === 'general' || physicalGen.length === 0}
            onClick={() => handleInventoryPrint('general')}
          >
            PDF General ({physicalGen.length})
          </button>
        </div>
        {physicalPref.length === 0 && physicalGen.length === 0 ? (
          <p className="admin-ticket-preview__inventory-hint">
            Aún no hay filas <code>FISICO:INVENTARIO</code>. Ejecuta{' '}
            <code>physical_ticket_inventory.sql</code> y recarga Admin.
          </p>
        ) : null}
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
