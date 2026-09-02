/**
 * Reenvía el correo del ticket (con QR).
 * Body: { attendeeId: uuid }
 * Secrets: RESEND_API_KEY, RESEND_FROM, PUBLIC_SITE_URL
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/* ===== plantilla ticket (inline Dashboard) ===== */
const EVENT_META = {
  name: 'Shark Caribe Pitch Competition 2026',
  date: '25 de noviembre de 2026',
  time: '3:00 p. m. – 9:45 p. m.',
  venue: 'Hotel Dann Carlton · Barranquilla',
  address: 'Calle 98 No. 52B-10, Riomar',
}

const SEAT_LABELS = {
  preferencial: 'Preferencial',
  general: 'General',
}

/** Logos del pie (mismas rutas que content.js ORGANIZER / ALLIES). */
const TICKET_LOGOS = {
  organizer: [
    {
      name: 'IS Comunicaciones',
      src: '/issnofondo.png',
    },
  ],
  allies: [
    { name: 'CC Buenavista', src: '/logos/ccbuenavista.png' },
    { name: 'Prime Business School', src: '/logos/prime.png' },
    { name: 'SENA', src: '/logos/sena.png' },
    { name: 'Universidad Sergio Arboleda', src: '/logos/sergioarboleda.png' },
    { name: 'FCA', src: '/logos/fca.png', height: 36, maxWidth: 78 },
    { name: 'Índice', src: '/logos/indice.png' },
    { name: 'Reformada', src: '/logos/reformada.png' },
    { name: 'Mi Red', src: '/logos/mired.png', height: 36, maxWidth: 78 },
    { name: 'Space Rock', src: '/logos/spacerock.png', height: 36, maxWidth: 78 },
    { name: 'Universidad del Atlántico', src: '/logos/UA.png' },
    { name: 'Elena', src: '/logos/elena.jpeg' },
  ],
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAmount(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return null
  const pesos = Number(cents) / 100
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pesos)
}

/**
 * URL de imagen QR. El contenido del código es:
 *   sharkcaribe-ticket:<uuid>
 * (prefijo + UUID, corrección de errores alta) para que el escáner
 * no confunda un UUID mal leído con otro ticket.
 */
function qrImageUrl(token, _baseUrl = '') {
  const payload = String(token || '').trim().toLowerCase()
  if (!payload) return ''
  const dataPayload = `sharkcaribe-ticket:${payload}`
  const data = encodeURIComponent(dataPayload)
  return `https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=12&ecc=H&data=${data}`
}

function resolveAssetUrl(path, baseUrl = '') {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = String(baseUrl || '').replace(/\/$/, '')
  const rel = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${rel}` : rel
}

/** Franja metalizada oro ↔ plata (solo Preferencial; funciona en la mayoría de clientes de correo). */
function metalStripeHtml() {
  return `<div style="height:6px;line-height:0;font-size:0;background:linear-gradient(90deg,#6b5428 0%,#c4922e 14%,#f5e6a8 28%,#fff8e0 38%,#e8eef4 50%,#b8c0cc 58%,#f0d78c 72%,#c4922e 88%,#8a6a28 100%);">&nbsp;</div>`
}

function themeForSeat(seatType) {
  const featured = seatType === 'preferencial'
  if (featured) {
    return {
      featured: true,
      /* Capas: foil diagonal sutil + base navy→oro */
      headerBg:
        'linear-gradient(118deg,rgba(255,215,106,0) 0%,rgba(255,215,106,0.14) 42%,rgba(232,238,244,0.18) 50%,rgba(255,215,106,0.1) 58%,rgba(255,215,106,0) 100%),linear-gradient(155deg,#141c38 0%,#1a2340 32%,#2a2418 68%,#c4922e 145%)',
      accent: '#c4922e',
      bodyBg: 'linear-gradient(180deg,#f7f3e8 0%,#fffdf5 40%,#ffffff 100%)',
      /* Champagne (menos gris) */
      infoBg: 'linear-gradient(165deg,#fff8e8 0%,#f5e8c8 45%,#ebd9a8 100%)',
      border: '#c4922e',
      borderWidth: 5,
      titleColor: '#ffd76a',
      muted: '#6b5a3a',
      sharky: '/sharky.png',
      outerGlow:
        '0 20px 56px rgba(196,146,46,0.45),0 0 0 1px rgba(255,215,106,0.4)',
    }
  }
  return {
    featured: false,
    headerBg: 'linear-gradient(145deg,#172554 0%,#0d1a3d 60%,#2b57ff 140%)',
    accent: '#2b57ff',
    bodyBg: 'linear-gradient(180deg,#eef2ff 0%,#f8faff 45%,#ffffff 100%)',
    infoBg: 'linear-gradient(160deg,#eef4ff 0%,#d9e6ff 50%,#c8dbff 100%)',
    border: '#2b57ff',
    borderWidth: 2,
    titleColor: '#ffffff',
    muted: '#4a5a78',
    sharky: '/sharky.png',
    outerGlow: '0 16px 48px rgba(0,0,0,0.35)',
  }
}

function resolveLogoBg(logo, index, alternate) {
  if (logo?.bg === 'black' || logo?.bg === 'white') return logo.bg
  if (logo?.darkBg) return 'black'
  if (!alternate) return null
  return index % 2 === 0 ? 'white' : 'black'
}

function logoRowFlexHtml(
  logos,
  baseUrl,
  heightPx,
  maxWidthPx = 88,
  startIndex = 0,
  alternate = false
) {
  if (!logos.length) return ''
  const isOrganizerOnly = !alternate && logos.length === 1
  const cellH = isOrganizerOnly ? 72 : 68
  const cellW = isOrganizerOnly ? 160 : 'auto'
  const radius = isOrganizerOnly ? '6px' : '0'
  const organizerBorder = isOrganizerOnly ? 'border:1px solid #0d1a3d;' : ''
  const cellBase = isOrganizerOnly
    ? `flex:0 0 ${cellW}px;width:${cellW}px;height:${cellH}px;min-width:${cellW}px;min-height:${cellH}px;` +
      `padding:8px 14px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;` +
      `line-height:0;overflow:hidden;border-radius:${radius};background:transparent;${organizerBorder}`
    : `flex:0 0 auto;height:${cellH}px;min-width:${cellH}px;padding:6px 10px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;line-height:0;background:transparent;border:1px solid #0d1a3d;`
  const imgs = logos
    .map((logo, i) => {
      const src = resolveAssetUrl(logo.src, baseUrl)
      const h = Math.min(logo.height ?? heightPx, cellH - 16)
      const maxW = Math.min(
        logo.maxWidth ?? maxWidthPx,
        isOrganizerOnly ? cellW - 16 : maxWidthPx
      )
      const bg = resolveLogoBg(logo, startIndex + i, alternate)
      const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(logo.name)}" height="${h}" style="display:block;height:${h}px;width:auto;max-width:${maxW}px;object-fit:contain;" />`
      const join = !isOrganizerOnly && i > 0 ? 'margin-left:-1px;' : ''
      if (isOrganizerOnly) {
        return `<div style="${cellBase}">${img}</div>`
      }
      if (bg === 'black') {
        return `<div style="${cellBase}${join}background:#000000;">${img}</div>`
      }
      if (bg === 'white') {
        return `<div style="${cellBase}${join}background:#ffffff;">${img}</div>`
      }
      return `<div style="${cellBase}${join}">${img}</div>`
    })
    .join('')
  const rowJoin = !isOrganizerOnly && startIndex > 0 ? 'margin-top:-1px;' : ''
  return `<div style="display:flex;justify-content:center;align-items:center;flex-wrap:nowrap;width:100%;gap:0;margin:0;${rowJoin}">${imgs}</div>`
}

/** Filas centradas de logos (sin cuadrícula). */
function logoGridHtml(
  logos,
  baseUrl,
  heightPx,
  maxWidthPx = 72,
  perRow = 6,
  alternateBg = false
) {
  if (!logos.length) return ''
  if (logos.length === 1 && !alternateBg) {
    return logoRowFlexHtml(logos, baseUrl, heightPx, maxWidthPx, 0, false)
  }
  const chunks = []
  for (let i = 0; i < logos.length; i += perRow) {
    chunks.push(logos.slice(i, i + perRow))
  }
  return chunks
    .map((chunk, rowIdx) =>
      logoRowFlexHtml(
        chunk,
        baseUrl,
        heightPx,
        maxWidthPx,
        rowIdx * perRow,
        false
      )
    )
    .join('')
}

/**
 * @param {object} record
 * @param {{ baseUrl?: string }} [options]
 */
function buildAttendeeTicketEmail(record, options = {}) {
  const baseUrl = String(options.baseUrl || '').replace(/\/$/, '')

  const name = record.full_name || 'asistente'
  const seatType = record.seat_type || 'general'
  const seat = SEAT_LABELS[seatType] || seatType || 'Entrada'
  const ticketNo =
    record.ticket_number != null ? String(record.ticket_number) : '—'
  const amount = formatAmount(record.amount_in_cents)
  const reference = record.payment_reference || '—'
  const token = record.ticket_token || ''
  const qrUrl = qrImageUrl(token, baseUrl)
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

  const organizerHtml = logoGridHtml(TICKET_LOGOS.organizer, baseUrl, 64, 180, 1, false)
  const alliesHtml = logoGridHtml(TICKET_LOGOS.allies, baseUrl, 32, 70, 6, false)
  const metalBar = theme.featured ? metalStripeHtml() : ''
  const vipBadge = theme.featured
    ? `<p style="margin:14px 0 0;"><span style="display:inline-block;padding:7px 16px;border-radius:999px;border:1px solid #ffd76a;background:linear-gradient(180deg,#3a3120 0%,#1a2340 100%);color:#ffd76a;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Acceso Preferencial</span></p>`
    : ''
  const ticketOrnament = theme.featured
    ? `<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.35em;color:#c4922e;">◆ ◆ ◆</p>`
    : ''
  const ticketNumberHtml = theme.featured
    ? `<p style="margin:0 0 6px;font-size:54px;font-weight:800;line-height:1;color:${theme.titleColor};letter-spacing:0.02em;">#${escapeHtml(ticketNo)}</p>
          <div style="width:88px;height:3px;margin:0 auto 16px;border-radius:2px;background:linear-gradient(90deg,#8a6a28,#ffd76a,#e8eef4,#ffd76a,#c4922e);"></div>`
    : `<p style="margin:0 0 14px;font-size:42px;font-weight:800;line-height:1;color:${theme.titleColor};">#${escapeHtml(ticketNo)}</p>`
  const vipFooter = theme.featured
    ? `<p style="margin:14px 0 0;text-align:center;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#8a6a28;">VIP · Fila Preferencial</p>`
    : ''
  const sectionLabelColor = theme.featured ? '#8a6a28' : '#64748b'
  const contactColor = theme.featured ? '#8a7350' : '#64748b'

  const cardInner = `
        <div style="background:${theme.headerBg};color:#fff;padding:22px 22px 18px;text-align:center;">
          ${ticketOrnament}
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">Número de ticket</p>
          ${ticketNumberHtml}
          <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:0.04em;line-height:1.1;text-transform:uppercase;">Pitch Competition</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:800;letter-spacing:0.06em;line-height:1.1;text-transform:uppercase;color:${theme.titleColor};">Shark Caribe</p>
          ${vipBadge}
        </div>
        ${metalBar}
        <div style="background:#ffffff;padding:18px 18px 14px;text-align:center;">
          ${
            qrUrl
              ? `<img src="${escapeHtml(qrUrl)}" alt="QR ticket ${escapeHtml(ticketNo)}" width="480" style="display:block;width:100%;max-width:100%;height:auto;background:#fff;" />
            <p style="margin:10px 0 0;font-size:12px;color:${theme.muted};">Código único de acceso · ${escapeHtml(seat)}</p>`
              : ''
          }
        </div>
        ${metalBar}
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
          <p style="margin:0 0 8px;text-align:center;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${sectionLabelColor};font-weight:700;">Organiza</p>
          ${organizerHtml}
          <p style="margin:14px 0 8px;text-align:center;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${sectionLabelColor};font-weight:700;">Aliados</p>
          ${alliesHtml}
          ${vipFooter}
          <p style="margin:16px 0 0;text-align:center;font-size:13px;line-height:1.45;color:#0d1a3d;font-weight:700;">
            Presenta este ticket (o el código QR) el día del evento para ingresar.
          </p>
          <p style="margin:10px 0 0;text-align:center;font-size:11px;color:${contactColor};">Shark Caribe · administrativo@sharkcaribe.co</p>
        </div>`

  /* Preferencial: triple filete (oro → plata → oro grueso) */
  const cardHtml = theme.featured
    ? `<div style="max-width:560px;margin:0 auto;padding:4px;border-radius:22px;background:linear-gradient(135deg,#6b5428 0%,#f5e6a8 22%,#ffffff 38%,#c0c8d4 50%,#f0d78c 72%,#c4922e 100%);box-shadow:${theme.outerGlow};">
      <div style="padding:3px;border-radius:18px;background:linear-gradient(315deg,#e8eef4 0%,#b8c0cc 35%,#f5e6a8 70%,#c4922e 100%);">
        <div style="border-radius:15px;overflow:hidden;border:${theme.borderWidth}px solid ${theme.border};background:#0f1a3d;">
          ${cardInner}
        </div>
      </div>
    </div>`
    : `<div style="max-width:560px;margin:0 auto;border-radius:18px;overflow:hidden;box-shadow:${theme.outerGlow};border:${theme.borderWidth}px solid ${theme.border};">
        ${cardInner}
      </div>`

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#0a1330;padding:24px;color:#0d1a3d;">
      <div style="max-width:560px;margin:0 auto 16px;color:#e2e8f0;font-size:14px;line-height:1.5;">
        <p style="margin:0 0 8px;">Hola <strong style="color:#fff;">${escapeHtml(name)}</strong>,</p>
        <p style="margin:0;color:#94a3b8;">Gracias por tu compra. Este es tu ticket de acceso:</p>
      </div>
      ${cardHtml}
    </div>
  `

  return {
    subject: `Tu ticket #${ticketNo} · Shark Caribe 2026`,
    html,
  }
}

/* ===== fin plantilla ===== */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Detecta JWT service_role (string exacto o claim role). */
function isServiceRoleToken(bearer, serviceKey) {
  if (!bearer) return false
  if (serviceKey && bearer === serviceKey) return true
  try {
    const payloadPart = bearer.split('.')[1]
    if (!payloadPart) return false
    const jsonPayload = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(jsonPayload)
    return payload?.role === 'service_role'
  } catch {
    return false
  }
}

function ticketBaseUrl() {
  return (Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
}

async function sendResendEmail({ apiKey, from, to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || 'Resend respondió ' + res.status)
  return body
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' })

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!apiKey || !from || !supabaseUrl || !serviceKey || !anonKey) {
    return json(500, { error: 'Función no configurada (Resend o keys).' })
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return json(401, { error: 'No autenticado.' })

  const bearer = authHeader.slice('Bearer '.length).trim()
  const serviceOk = isServiceRoleToken(bearer, serviceKey)

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (!serviceOk) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) {
      return json(401, {
        error:
          'Sesión inválida. Usa service_role legacy (eyJ...) o sesión admin. ¿Redesplegaste resend-ticket?',
      })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role !== 'admin') return json(403, { error: 'Solo administradores.' })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'JSON inválido.' })
  }
  const attendeeId = String(body.attendeeId || '').trim()
  if (!attendeeId) return json(400, { error: 'Falta attendeeId.' })

  const { data: record, error } = await admin
    .from('attendee_registrations')
    .select(
      'id, email, full_name, seat_type, ticket_number, ticket_token, amount_in_cents, payment_reference, status'
    )
    .eq('id', attendeeId)
    .maybeSingle()
  if (error) return json(500, { error: 'No se pudo leer el asistente.' })
  if (!record) return json(404, { error: 'Asistente no encontrado.' })
  if (String(record.status || '').toLowerCase() !== 'pago') {
    return json(400, { error: 'El asistente aún no tiene pago confirmado.' })
  }
  const email = String(record.email || '').trim().toLowerCase()
  if (!email.includes('@')) return json(400, { error: 'El registro no tiene correo válido.' })

  let ticketToken = record.ticket_token
  if (!ticketToken) {
    const { data: patched, error: patchError } = await admin
      .from('attendee_registrations')
      .update({ ticket_token: crypto.randomUUID() })
      .eq('id', record.id)
      .select('ticket_token')
      .maybeSingle()
    if (patchError || !patched?.ticket_token) {
      return json(500, {
        error: 'No se pudo generar ticket_token. Ejecuta attendee_checkin.sql.',
      })
    }
    ticketToken = patched.ticket_token
  }

  const content = buildAttendeeTicketEmail(
    { ...record, ticket_token: ticketToken },
    { baseUrl: ticketBaseUrl() }
  )
  try {
    await sendResendEmail({
      apiKey,
      from,
      to: [email],
      subject: content.subject,
      html: content.html,
    })
  } catch (err) {
    return json(502, {
      error: err instanceof Error ? err.message : 'No se pudo enviar el correo.',
    })
  }
  return json(200, { ok: true, to: email, ticket_number: record.ticket_number })
})
