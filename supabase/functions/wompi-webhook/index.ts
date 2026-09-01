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

/* ===== fin plantilla ===== */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-event-checksum',
}

const PAYMENT_TABLES = [
  'attendee_registrations',
  'sponsor_registrations',
  'exhibitor_registrations',
]

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function readNested(obj, pathName) {
  return pathName.split('.').reduce((acc, key) => {
    if (acc == null) return undefined
    return acc[key]
  }, obj)
}

function normalizeStatus(value) {
  if (value == null) return ''
  return String(value).trim().toLowerCase()
}

function pickEmail(record) {
  const email = String(record?.email || '').trim().toLowerCase()
  return email.includes('@') ? email : ''
}

function ticketBaseUrl() {
  return (
    Deno.env.get('PUBLIC_SITE_URL') ||
    Deno.env.get('SITE_URL') ||
    ''
  ).replace(/\/$/, '')
}

async function verifyEventChecksum(event, eventsSecret) {
  const properties = event?.signature?.properties
  const checksum = (event?.signature?.checksum || '').toString().toUpperCase()
  const timestamp = event?.timestamp
  if (!Array.isArray(properties) || !checksum || timestamp == null) return false
  let concat = ''
  for (const prop of properties) {
    const value = readNested(event.data, prop)
    if (value === undefined || value === null) return false
    concat += String(value)
  }
  concat += String(timestamp)
  concat += eventsSecret
  return (await sha256Hex(concat)) === checksum
}

async function findRegistrationByReference(supabase, reference) {
  for (const table of PAYMENT_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('id, status, amount_in_cents, wompi_transaction_id')
      .eq('payment_reference', reference)
      .maybeSingle()
    if (error) {
      console.error('[wompi-webhook] find error', { table, error })
      return { error }
    }
    if (data) return { table, row: data }
  }
  return { table: null, row: null }
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

function buildPaymentConfirmEmail(table, record) {
  if (table === 'attendee_registrations') {
    return buildAttendeeTicketEmail(record, { baseUrl: ticketBaseUrl() })
  }
  const isSponsor = table === 'sponsor_registrations'
  const label = isSponsor ? 'Patrocinador' : 'Expositor muestra comercial'
  const name =
    record.contact_name || record.company_name || record.full_name || 'inscrito'
  const detail = isSponsor
    ? record.plan
      ? 'Plan: ' + record.plan
      : ''
    : record.stand_type
      ? 'Stand: ' + record.stand_type
      : ''
  const amount = formatAmount(record.amount_in_cents)
  const html =
    '<div style="font-family:Segoe UI,Arial,sans-serif;color:#0d1a3d;line-height:1.5;max-width:560px;">' +
    '<h2 style="margin:0 0 12px;">Pago confirmado · ' +
    escapeHtml(label) +
    '</h2><p>Hola ' +
    escapeHtml(name) +
    ',</p><p>Confirmamos tu pago para <strong>' +
    escapeHtml(label) +
    '</strong> en Shark Caribe 2026.</p>' +
    (detail ? '<p>' + escapeHtml(detail) + '</p>' : '') +
    (amount ? '<p><strong>Monto:</strong> ' + escapeHtml(amount) + '</p>' : '') +
    '<p style="color:#64748b;font-size:13px;">Referencia: ' +
    escapeHtml(record.payment_reference || '—') +
    '</p><p style="color:#64748b;font-size:13px;">Shark Caribe · administrativo@sharkcaribe.co</p></div>'
  return { subject: 'Pago confirmado · ' + label + ' · Shark Caribe', html }
}

async function fetchPaidRecord(supabase, table, id) {
  const selects = {
    attendee_registrations:
      'id, email, full_name, seat_type, ticket_number, ticket_token, amount_in_cents, payment_reference, status',
    sponsor_registrations:
      'id, email, contact_name, company_name, plan, amount_in_cents, payment_reference, status',
    exhibitor_registrations:
      'id, email, contact_name, company_name, stand_type, amount_in_cents, payment_reference, status',
  }
  const { data, error } = await supabase
    .from(table)
    .select(selects[table] || '*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

async function sendPaidEmail(table, record) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM')
  if (!apiKey || !from) {
    console.warn('[wompi-webhook] Resend no configurado; se omite correo')
    return { skipped: true, reason: 'resend_not_configured' }
  }
  const to = pickEmail(record)
  if (!to) {
    console.warn('[wompi-webhook] Registro sin email; se omite correo', {
      table,
      id: record?.id,
    })
    return { skipped: true, reason: 'no_email' }
  }
  const content = buildPaymentConfirmEmail(table, record)
  await sendResendEmail({
    apiKey,
    from,
    to: [to],
    subject: content.subject,
    html: content.html,
  })
  return { sent: true, to }
}

Deno.serve(async (req) => {
  console.info('[wompi-webhook] request', { method: req.method })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' })

  const eventsSecret = Deno.env.get('WOMPI_EVENTS_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!eventsSecret || !supabaseUrl || !serviceKey) {
    return json(500, { error: 'Webhook no configurado.' })
  }

  let event
  try {
    event = await req.json()
  } catch {
    return json(400, { error: 'JSON inválido.' })
  }

  const headerChecksum = (req.headers.get('X-Event-Checksum') || '').toUpperCase()
  const bodyChecksum = (event?.signature?.checksum || '').toString().toUpperCase()
  if (headerChecksum && bodyChecksum && headerChecksum !== bodyChecksum) {
    return json(401, { error: 'Checksum inconsistente.' })
  }
  if (!(await verifyEventChecksum(event, eventsSecret))) {
    return json(401, { error: 'Firma de evento inválida.' })
  }
  if (event.event !== 'transaction.updated') return json(200, { ok: true, ignored: true })
  const tx = event.data?.transaction
  if (!tx?.reference) return json(200, { ok: true, ignored: true })

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const reference = String(tx.reference)
  const status = String(tx.status || '')
  const transactionId = tx.id ? String(tx.id) : null
  const amountInCents =
    typeof tx.amount_in_cents === 'number' ? tx.amount_in_cents : null

  const found = await findRegistrationByReference(supabase, reference)
  if (found.error) return json(500, { error: 'Error al buscar registro.' })
  const { table, row } = found
  if (!row || !table) return json(200, { ok: true, unknownReference: true })
  const rowStatus = normalizeStatus(row.status)

  if (
    amountInCents != null &&
    row.amount_in_cents != null &&
    Number(amountInCents) !== Number(row.amount_in_cents)
  ) {
    return json(200, { ok: true, amountMismatch: true })
  }

  if (status === 'APPROVED') {
    if (rowStatus === 'pago') return json(200, { ok: true, alreadyPaid: true, table })
    const { data: updatedRows, error: updateError } = await supabase
      .from(table)
      .update({
        status: 'pago',
        payment_confirmation: transactionId
          ? 'WOMPI:' + transactionId
          : 'WOMPI:APPROVED',
        wompi_transaction_id: transactionId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .select('id')
    if (updateError) return json(500, { error: 'No se pudo marcar el pago.' })
    const updatedCount = Array.isArray(updatedRows) ? updatedRows.length : 0
    if (updatedCount === 0) return json(500, { error: 'No se actualizó ninguna fila.' })

    let emailResult = null
    try {
      const paidRecord = await fetchPaidRecord(supabase, table, row.id)
      if (paidRecord) emailResult = await sendPaidEmail(table, paidRecord)
    } catch (err) {
      emailResult = { error: err instanceof Error ? err.message : 'email_failed' }
    }
    return json(200, {
      ok: true,
      paid: true,
      table,
      rows: updatedCount,
      email: emailResult,
    })
  }

  if (transactionId && rowStatus !== 'pago' && !row.wompi_transaction_id) {
    await supabase
      .from(table)
      .update({ wompi_transaction_id: transactionId })
      .eq('id', row.id)
  }
  return json(200, { ok: true, status, table })
})
