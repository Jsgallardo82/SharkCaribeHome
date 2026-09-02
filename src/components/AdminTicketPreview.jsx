import { useEffect, useMemo, useState } from 'react'
import {
  SAMPLE_TICKET_GENERAL,
  SAMPLE_TICKET_PREFERENCIAL,
  buildAttendeeTicketEmail,
} from '../lib/attendeeTicketEmail.js'

/** Hoja de imprenta: 32 × 47 cm */
const PAGE_W_MM = 320
const PAGE_H_MM = 470
const PAGE_MARGIN_MM = 6
const GRID_GAP_MM = 4
const TICKET_BASE_W = 560
const MIN_SCALE = 0.26
const MAX_SCALE = 0.42

function isPhysicalInventoryTicket(row) {
  const conf = String(row?.payment_confirmation || '')
  const doc = String(row?.document_number || '')
  return (
    conf === 'FISICO:INVENTARIO' ||
    doc.startsWith('FIS-PREF-') ||
    doc.startsWith('FIS-GEN-')
  )
}

/**
 * @param {Array<{ label: string, html: string }>} tickets
 * @param {string} title
 * @param {{ cols?: number }} [options] cols=0 → máximo automático
 */
function openPrintWindow(tickets, title, options = {}) {
  if (!tickets.length) {
    window.alert('No hay boletas para imprimir.')
    return
  }

  const forcedCols = Number(options.cols) || 0

  /* Primera pasada: HTML con escala provisional; el script mide y reajusta */
  const provisionalScale = 0.32
  const frameW = Math.round(TICKET_BASE_W * provisionalScale)

  const cellsHtml = tickets
    .map(
      (ticket, idx) => `
    <div class="ticket-cell" data-idx="${idx}">
      <p class="print-label">${ticket.label}</p>
      <div class="ticket-frame">
        <div class="ticket-scale">${ticket.html}</div>
      </div>
    </div>`
    )
    .join('\n')

  const doc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: ${PAGE_W_MM}mm ${PAGE_H_MM}mm;
      margin: ${PAGE_MARGIN_MM}mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      color: #0d1a3d;
      font-family: Segoe UI, Arial, sans-serif;
    }
    .no-print {
      text-align: center;
      padding: 12px 16px;
      font-size: 14px;
      color: #64748b;
      max-width: 40rem;
      margin: 0 auto;
    }
    .sheet {
      width: ${PAGE_W_MM - PAGE_MARGIN_MM * 2}mm;
      height: ${PAGE_H_MM - PAGE_MARGIN_MM * 2}mm;
      margin: 0 auto 12px;
      padding: 0;
      background: #fff;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      display: grid;
      grid-template-columns: repeat(2, max-content);
      grid-auto-rows: max-content;
      gap: ${GRID_GAP_MM}mm;
      justify-content: center;
      align-content: start;
      overflow: hidden;
    }
    .sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .ticket-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
      /* evita que el transform “se salga” y tape vecinos */
      position: relative;
    }
    .print-label {
      margin: 0 0 2px;
      font-size: 7px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      text-align: center;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .ticket-frame {
      display: block;
      width: ${frameW}px;
      height: auto;
      overflow: hidden;
      position: relative;
    }
    .ticket-scale {
      width: ${TICKET_BASE_W}px;
      transform: scale(${provisionalScale});
      transform-origin: top left;
      pointer-events: none;
    }
    .ticket-scale > div {
      padding: 4px !important;
      background: transparent !important;
    }
    /* Oculta el saludo del correo; deja solo la boleta */
    .ticket-scale > div > div:first-child {
      display: none !important;
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .sheet {
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <p class="no-print" id="print-hint">
    Preparando cuadrícula ${PAGE_W_MM / 10}×${PAGE_H_MM / 10} cm…
    Espera a que carguen los QR y luego “Guardar como PDF”.
  </p>
  <div id="measure-host" style="position:absolute;left:-99999px;top:0;visibility:hidden;">
    ${tickets[0] ? `<div class="ticket-scale" id="measure-scale" style="transform:none;width:${TICKET_BASE_W}px;">${tickets[0].html}</div>` : ''}
  </div>
  <div id="sheets-root">${cellsHtml}</div>
  <script>
    (async function () {
      var TICKET_BASE_W = ${TICKET_BASE_W};
      var forcedCols = ${forcedCols};
      var tickets = ${JSON.stringify(tickets.map((t) => ({ label: t.label })))};
      var htmls = ${JSON.stringify(tickets.map((t) => t.html))};

      function mmToPx(mm) { return (mm * 96) / 25.4; }
      function pickGridLayout(unscaledHeightPx, forcedCols) {
        var usableW = mmToPx(${PAGE_W_MM - PAGE_MARGIN_MM * 2});
        var usableH = mmToPx(${PAGE_H_MM - PAGE_MARGIN_MM * 2});
        var gap = mmToPx(${GRID_GAP_MM});
        var labelH = 14;
        var best = { scale: 0.32, cols: 2, rows: 2, perPage: 4, cellW: 0, cellH: 0 };
        for (var s = ${MAX_SCALE}; s >= ${MIN_SCALE} - 0.001; s -= 0.01) {
          var tw = TICKET_BASE_W * s;
          var th = unscaledHeightPx * s + labelH;
          var colsMax = Math.max(1, Math.floor((usableW + gap) / (tw + gap)));
          var cols = forcedCols > 0 ? Math.min(forcedCols, colsMax) : colsMax;
          if (cols < 1) continue;
          var rows = Math.max(1, Math.floor((usableH + gap) / (th + gap)));
          var perPage = cols * rows;
          if (perPage > best.perPage || (perPage === best.perPage && s > best.scale)) {
            best = {
              scale: Math.round(s * 100) / 100,
              cols: cols,
              rows: rows,
              perPage: perPage,
              cellW: Math.ceil(tw),
              cellH: Math.ceil(th)
            };
          }
        }
        return best;
      }

      var imgs = Array.from(document.images || []);
      await Promise.all(imgs.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      var measure = document.getElementById('measure-scale');
      if (measure) {
        var hide = measure.querySelector(':scope > div > div:first-child');
        if (hide) hide.style.display = 'none';
      }
      var unscaledH = measure ? measure.scrollHeight : 900;
      var layout = pickGridLayout(unscaledH, forcedCols);

      var root = document.getElementById('sheets-root');
      root.innerHTML = '';
      var perPage = layout.perPage;
      var sheetCount = Math.ceil(htmls.length / perPage);

      for (var si = 0; si < sheetCount; si++) {
        var sheet = document.createElement('section');
        sheet.className = 'sheet';
        sheet.style.gridTemplateColumns = 'repeat(' + layout.cols + ', ' + layout.cellW + 'px)';
        sheet.style.gridAutoRows = layout.cellH + 'px';

        for (var ci = 0; ci < perPage; ci++) {
          var idx = si * perPage + ci;
          if (idx >= htmls.length) break;

          var cell = document.createElement('div');
          cell.className = 'ticket-cell';
          cell.style.width = layout.cellW + 'px';
          cell.style.height = layout.cellH + 'px';

          var label = document.createElement('p');
          label.className = 'print-label';
          label.textContent = tickets[idx].label;

          var frame = document.createElement('div');
          frame.className = 'ticket-frame';
          frame.style.width = layout.cellW + 'px';
          frame.style.height = Math.ceil(unscaledH * layout.scale) + 'px';
          frame.style.overflow = 'hidden';

          var scaleEl = document.createElement('div');
          scaleEl.className = 'ticket-scale';
          scaleEl.style.width = TICKET_BASE_W + 'px';
          scaleEl.style.transform = 'scale(' + layout.scale + ')';
          scaleEl.style.transformOrigin = 'top left';
          scaleEl.innerHTML = htmls[idx];

          var greet = scaleEl.querySelector(':scope > div > div:first-child');
          if (greet) greet.style.display = 'none';

          frame.appendChild(scaleEl);
          cell.appendChild(label);
          cell.appendChild(frame);
          sheet.appendChild(cell);
        }
        root.appendChild(sheet);
      }

      var hint = document.getElementById('print-hint');
      if (hint) {
        hint.textContent =
          htmls.length + ' boleta(s) · hoja ' + ${PAGE_W_MM / 10} + '×' + ${PAGE_H_MM / 10} +
          ' cm · cuadrícula ' + layout.cols + '×' + layout.rows +
          ' (' + layout.perPage + ' por hoja) · ' + sheetCount + ' página(s) · escala ' +
          Math.round(layout.scale * 100) + '%. Usa “Guardar como PDF”.';
      }

      /* Re-espera imágenes del HTML inyectado */
      var imgs2 = Array.from(document.images || []);
      await Promise.all(imgs2.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      setTimeout(function () {
        window.focus();
        window.print();
      }, 500);
    })();
  </script>
</body>
</html>`

  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'width=900,height=1000')
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
    'Tickets Shark Caribe — ejemplos · 32×47 cm',
    { cols: 0 }
  )
}

function openInventoryPrintWindow(records, seatLabel, cols) {
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

  openPrintWindow(
    tickets,
    `Inventario físico · ${seatLabel} · ${tickets.length} boletas · 32×47 cm`,
    { cols }
  )
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
  /** 0 = máximo automático; 2 o 3 = forzar columnas */
  const [gridCols, setGridCols] = useState(0)

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
    const ok = window.confirm(
      `PDF en hoja 32×47 cm (cuadrícula, sin solapes).\n` +
        `${rows.length} boletas ${label}.\n` +
        'En el diálogo de impresión elige tamaño personalizado 320×470 mm si el navegador no lo toma solo.\n\n' +
        '¿Continuar?'
    )
    if (!ok) return
    setBusyPrint(kind)
    try {
      openInventoryPrintWindow(rows, label, gridCols)
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
          Hoja <strong>32 × 47 cm</strong>. Cuadrícula ordenada (lado a lado y
          filas abajo), sin solapes. Por defecto mete el máximo posible
          manteniendo el QR legible.
        </p>
        <label className="admin-ticket-preview__select admin-ticket-preview__per-page">
          <span>Distribución</span>
          <select
            value={gridCols}
            onChange={(e) => setGridCols(Number(e.target.value))}
          >
            <option value={0}>Máximo automático (recomendado)</option>
            <option value={2}>2 columnas (cuadrícula)</option>
            <option value={3}>3 columnas (cuadrícula)</option>
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
