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
  time: '5:00 p. m. – 9:45 p. m.',
  venue: 'Hotel Dann Carlton · Barranquilla',
  address: 'Calle 98 No. 52B-10, Riomar',
}

const SEAT_LABELS = {
  preferencial: 'Preferencial',
  general: 'General',
}

const TICKET_LOGOS = {
  organizer: [{ name: 'IS Comunicaciones', src: '/issnofondo.png' }],
  allies: [
    { name: 'Universidad Sergio Arboleda', src: '/logos/sergioarboleda.png' },
    { name: 'Prime Business School', src: '/logos/prime.png' },
    { name: 'SENA', src: '/logos/sena.png' },
    { name: 'Índice', src: '/logos/indice.png' },
    { name: 'FCA', src: '/logos/fca.png' },
    { name: 'Elena', src: '/logos/elena.jpeg' },
    { name: 'Mi Red', src: '/logos/mired.png' },
    { name: 'Space Rock', src: '/logos/spacerock.png' },
    { name: 'CC Buenavista', src: '/logos/ccbuenavista.png' },
    { name: 'Reformada', src: '/logos/reformada.png' },
    { name: 'Universidad del Atlántico', src: '/logos/UA.png' },
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

function qrImageUrl(token) {
  const payload = String(token || '').trim()
  if (!payload) return ''
  const data = encodeURIComponent(payload)
  return `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&data=${data}`
}

function resolveAssetUrl(path, baseUrl = '') {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = String(baseUrl || '').replace(/\/$/, '')
  const rel = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${rel}` : rel
}

function themeForSeat(seatType) {
  if (seatType === 'preferencial') {
    return {
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
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(logo.name)}" height="${heightPx}" style="display:block;height:${heightPx}px;width:auto;max-width:${maxWidthPx}px;object-fit:contain;flex:0 0 auto;margin:0 auto;" />`
    })
    .join('')
  const justify = logos.length === 1 ? 'center' : 'space-between'
  return `<div style="display:flex;justify-content:${justify};align-items:center;width:100%;gap:4px;margin:0 0 8px;">${imgs}</div>`
}

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

/** @param {Record<string, unknown>} record @param {{ baseUrl?: string }} [options] */
function buildAttendeeTicketEmail(record, options = {}) {
  const baseUrl = String(options.baseUrl || '').replace(/\/$/, '')
  const name = record.full_name || 'asistente'
  const seatType = String(record.seat_type || 'general')
  const seat = SEAT_LABELS[seatType] || seatType || 'Entrada'
  const ticketNo =
    record.ticket_number != null ? String(record.ticket_number) : '—'
  const amount = formatAmount(record.amount_in_cents)
  const reference = String(record.payment_reference || '—')
  const token = String(record.ticket_token || '')
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
        <div style="background:${theme.headerBg};color:#fff;padding:22px 22px 18px;text-align:center;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">Número de ticket</p>
          <p style="margin:0 0 14px;font-size:42px;font-weight:800;line-height:1;color:${theme.titleColor};">#${escapeHtml(ticketNo)}</p>
          <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:0.04em;line-height:1.1;text-transform:uppercase;">Pitch Competition</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:800;letter-spacing:0.06em;line-height:1.1;text-transform:uppercase;color:${theme.titleColor};">Shark Caribe</p>
        </div>

        <div style="background:#ffffff;padding:18px 18px 14px;text-align:center;">
          ${
            qrUrl
              ? `<img src="${escapeHtml(qrUrl)}" alt="QR ticket ${escapeHtml(ticketNo)}" width="480" style="display:block;width:100%;max-width:100%;height:auto;background:#fff;" />
            <p style="margin:10px 0 0;font-size:12px;color:${theme.muted};">Código único de acceso · ${escapeHtml(seat)}</p>`
              : ''
          }
        </div>

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
          <p style="margin:14px 0 0;text-align:center;font-size:11px;color:#64748b;">Shark Caribe · administrativo@sharkcaribe.co</p>
        </div>
      </div>
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
