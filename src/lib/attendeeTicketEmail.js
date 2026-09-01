/** Plantilla del boleto (correo Resend + vista previa Admin). */

export const EVENT_META = {
  name: 'Shark Caribe Pitch Competition 2026',
  date: '25 de noviembre de 2026',
  time: '5:00 p. m. – 9:45 p. m.',
  venue: 'Hotel Dann Carlton · Barranquilla',
  address: 'Calle 98 No. 52B-10, Riomar',
}

export const SEAT_LABELS = {
  preferencial: 'Preferencial',
  general: 'General',
}

/** Logos del pie (mismas rutas que content.js ORGANIZER / ALLIES). */
export const TICKET_LOGOS = {
  organizer: [
    {
      name: 'IS Comunicaciones',
      src: '/issnofondo.png',
      darkBg: true,
    },
  ],
  allies: [
    { name: 'Universidad Sergio Arboleda', src: '/logos/sergioarboleda.png' },
    { name: 'Prime Business School', src: '/logos/prime.png', darkBg: true },
    { name: 'SENA', src: '/logos/sena.png' },
    { name: 'CC Buenavista', src: '/logos/ccbuenavista.png' },
    { name: 'Índice', src: '/logos/indice.png' },
    { name: 'FCA', src: '/logos/fca.png', height: 36, maxWidth: 78 },
    { name: 'Space Rock', src: '/logos/spacerock.png', height: 36, maxWidth: 78 },
    { name: 'Mi Red', src: '/logos/mired.png', height: 36, maxWidth: 78 },
    { name: 'Elena', src: '/logos/elena.jpeg' },
    { name: 'Reformada', src: '/logos/reformada.png' },
    { name: 'Universidad del Atlántico', src: '/logos/UA.png' },
  ],
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatAmount(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return null
  const pesos = Number(cents) / 100
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pesos)
}

export function qrImageUrl(token) {
  const payload = String(token || '').trim()
  if (!payload) return ''
  const data = encodeURIComponent(payload)
  return `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&data=${data}`
}

export function resolveAssetUrl(path, baseUrl = '') {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = String(baseUrl || '').replace(/\/$/, '')
  const rel = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${rel}` : rel
}

export const SAMPLE_TICKET_PREFERENCIAL = {
  full_name: 'María Ejemplo',
  seat_type: 'preferencial',
  ticket_number: 1,
  ticket_token: '00000000-0000-4000-8000-000000000001',
  amount_in_cents: 7990000,
  payment_reference: 'DEMO-REF-001',
}

export const SAMPLE_TICKET_GENERAL = {
  full_name: 'Carlos Ejemplo',
  seat_type: 'general',
  ticket_number: 2,
  ticket_token: '00000000-0000-4000-8000-000000000002',
  amount_in_cents: 5000000,
  payment_reference: 'DEMO-REF-002',
}

/** @deprecated usar SAMPLE_TICKET_PREFERENCIAL */
export const SAMPLE_TICKET_RECORD = SAMPLE_TICKET_PREFERENCIAL

function themeForSeat(seatType) {
  const featured = seatType === 'preferencial'
  if (featured) {
    return {
      featured: true,
      headerBg: 'linear-gradient(145deg,#1a2340 0%,#0f1a3d 55%,#c4922e 160%)',
      accent: '#c4922e',
      bodyBg: 'linear-gradient(180deg,#f7f3e8 0%,#fffdf5 40%,#ffffff 100%)',
      infoBg: 'linear-gradient(160deg,#f2f3f5 0%,#d8dce3 45%,#c5ccd6 100%)',
      border: '#c4922e',
      titleColor: '#ffd76a',
      muted: '#5a6170',
      sharky: '/sharky.png',
    }
  }
  return {
    featured: false,
    headerBg: 'linear-gradient(145deg,#172554 0%,#0d1a3d 60%,#2b57ff 140%)',
    accent: '#2b57ff',
    bodyBg: 'linear-gradient(180deg,#eef2ff 0%,#f8faff 45%,#ffffff 100%)',
    infoBg: 'linear-gradient(160deg,#eef4ff 0%,#d9e6ff 50%,#c8dbff 100%)',
    border: '#2b57ff',
    titleColor: '#ffffff',
    muted: '#4a5a78',
    sharky: '/sharky.png',
  }
}

function logoRowFlexHtml(logos, baseUrl, heightPx, maxWidthPx = 88) {
  if (!logos.length) return ''
  const imgs = logos
    .map((logo) => {
      const src = resolveAssetUrl(logo.src, baseUrl)
      const h = logo.height ?? heightPx
      const maxW = logo.maxWidth ?? maxWidthPx
      const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(logo.name)}" height="${h}" style="display:block;height:${h}px;width:auto;max-width:${maxW}px;object-fit:contain;margin:0 auto;" />`
      if (logo.darkBg) {
        return `<div style="flex:0 0 auto;background:#000000;border-radius:8px;padding:8px 10px;line-height:0;">${img}</div>`
      }
      return `<div style="flex:0 0 auto;line-height:0;">${img}</div>`
    })
    .join('')
  const justify = logos.length === 1 ? 'center' : 'space-between'
  return `<div style="display:flex;justify-content:${justify};align-items:center;width:100%;gap:4px;margin:0 0 8px;">${imgs}</div>`
}

/** Rejilla de logos en varias filas con space-between en cada fila. */
function logoGridHtml(logos, baseUrl, heightPx, maxWidthPx = 72, perRow = 6) {
  if (!logos.length) return ''
  const chunks = []
  for (let i = 0; i < logos.length; i += perRow) {
    chunks.push(logos.slice(i, i + perRow))
  }
  return chunks
    .map((chunk) => logoRowFlexHtml(chunk, baseUrl, heightPx, maxWidthPx))
    .join('')
}

/**
 * @param {object} record
 * @param {{ baseUrl?: string }} [options]
 */
export function buildAttendeeTicketEmail(record, options = {}) {
  const baseUrl =
    options.baseUrl ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '')

  const name = record.full_name || 'asistente'
  const seatType = record.seat_type || 'general'
  const seat = SEAT_LABELS[seatType] || seatType || 'Entrada'
  const ticketNo =
    record.ticket_number != null ? String(record.ticket_number) : '—'
  const amount = formatAmount(record.amount_in_cents)
  const reference = record.payment_reference || '—'
  const token = record.ticket_token || ''
  const qrUrl = qrImageUrl(token)
  const theme = themeForSeat(seatType)
  const sharkySrc = resolveAssetUrl(theme.sharky, baseUrl)

  const infoRows = [
    ['Tipo', seat],
    ['Evento', EVENT_META.name],
    ['Fecha', EVENT_META.date],
    ['Horario', EVENT_META.time],
    ['Lugar', EVENT_META.venue],
    ['Dirección', EVENT_META.address],
  ]
  if (amount) infoRows.push(['Monto', amount])
  infoRows.push(['Referencia', reference])

  const infoHtml = infoRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:5px 0;color:${theme.muted};font-size:12px;vertical-align:top;width:34%;">${escapeHtml(label)}</td>
        <td style="padding:5px 0;text-align:right;font-weight:700;font-size:12px;color:#0d1a3d;vertical-align:top;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('')

  const organizerHtml = logoGridHtml(TICKET_LOGOS.organizer, baseUrl, 64, 180, 1)
  const alliesHtml = logoGridHtml(TICKET_LOGOS.allies, baseUrl, 32, 70, 6)

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#0a1330;padding:24px;color:#0d1a3d;">
      <div style="max-width:560px;margin:0 auto 16px;color:#e2e8f0;font-size:14px;line-height:1.5;">
        <p style="margin:0 0 8px;">Hola <strong style="color:#fff;">${escapeHtml(name)}</strong>,</p>
        <p style="margin:0;color:#94a3b8;">Gracias por tu compra. Este es tu ticket de acceso:</p>
      </div>

      <div style="max-width:560px;margin:0 auto;border-radius:18px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.35);border:2px solid ${theme.border};">
        <!-- Encabezado -->
        <div style="background:${theme.headerBg};color:#fff;padding:22px 22px 18px;text-align:center;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">Número de ticket</p>
          <p style="margin:0 0 14px;font-size:42px;font-weight:800;line-height:1;color:${theme.titleColor};">#${escapeHtml(ticketNo)}</p>
          <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:0.04em;line-height:1.1;text-transform:uppercase;">Pitch Competition</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:800;letter-spacing:0.06em;line-height:1.1;text-transform:uppercase;color:${theme.titleColor};">Shark Caribe</p>
        </div>

        <!-- QR (fondo claro: mejor contraste para escanear) -->
        <div style="background:#ffffff;padding:18px 18px 14px;text-align:center;">
          ${
            qrUrl
              ? `<img src="${escapeHtml(qrUrl)}" alt="QR ticket ${escapeHtml(ticketNo)}" width="480" style="display:block;width:100%;max-width:100%;height:auto;background:#fff;" />
            <p style="margin:10px 0 0;font-size:12px;color:${theme.muted};">Código único de acceso · ${escapeHtml(seat)}</p>`
              : ''
          }
        </div>

        <!-- Franja plateada/azul: info + Sharky + logos -->
        <div style="background:${theme.infoBg};padding:18px 18px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
            <tr>
              <td width="58%" valign="top" style="padding-right:10px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${infoHtml}
                </table>
              </td>
              <td width="42%" valign="middle" style="text-align:center;">
                <img src="${escapeHtml(sharkySrc)}" alt="Sharky" width="160" style="display:inline-block;width:100%;max-width:160px;height:auto;" />
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;text-align:center;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:700;">Organiza</p>
          ${organizerHtml}
          <p style="margin:14px 0 8px;text-align:center;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:700;">Aliados</p>
          ${alliesHtml}
          <p style="margin:16px 0 0;text-align:center;font-size:13px;line-height:1.45;color:#0d1a3d;font-weight:700;">
            Presenta este ticket (o el código QR) el día del evento para ingresar.
          </p>
          <p style="margin:10px 0 0;text-align:center;font-size:11px;color:#64748b;">Shark Caribe · administrativo@sharkcaribe.co</p>
        </div>
      </div>
    </div>
  `

  return {
    subject: `Tu ticket #${ticketNo} · Shark Caribe 2026`,
    html,
  }
}
