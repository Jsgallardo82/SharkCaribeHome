/**
 * Reenvía el correo del ticket (con QR) a un asistente pagado.
 * Body: { attendeeId: uuid }
 * Secrets: RESEND_API_KEY, RESEND_FROM
 * En Dashboard: Verify JWT = ON (recomendado)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/* ===== plantilla ticket (inline para Dashboard) ===== */
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
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${data}`
}

function buildAttendeeTicketEmail(record) {
  const name = record.full_name || 'asistente'
  const seat = SEAT_LABELS[record.seat_type] || record.seat_type || 'Entrada'
  const ticketNo =
    record.ticket_number != null ? String(record.ticket_number) : '—'
  const amount = formatAmount(record.amount_in_cents)
  const reference = record.payment_reference || '—'
  const token = record.ticket_token || ''
  const qrUrl = qrImageUrl(token)

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#0a1330;padding:24px;color:#0d1a3d;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.25);">
        <div style="background:linear-gradient(135deg,#172554,#0d1a3d);color:#fff;padding:20px 24px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">Pago confirmado</p>
          <h1 style="margin:8px 0 0;font-size:22px;">Tu ticket Shark Caribe</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">Hola <strong>${escapeHtml(name)}</strong>,</p>
          <p style="margin:0 0 20px;">Tu pago fue exitoso. Presenta este boleto (QR) el día del evento:</p>
          <div style="border:2px dashed #c4922e;border-radius:14px;padding:18px 20px;background:linear-gradient(180deg,#fffdf5,#fff);">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Número de ticket</p>
            <p style="margin:0 0 16px;font-size:36px;font-weight:800;color:#c4922e;line-height:1;">#${escapeHtml(ticketNo)}</p>
            ${
              qrUrl
                ? `<div style="text-align:center;margin:0 0 16px;">
              <img src="${escapeHtml(qrUrl)}" width="220" height="220" alt="QR ticket ${escapeHtml(ticketNo)}" style="display:inline-block;border-radius:8px;border:1px solid #e2e8f0;" />
              <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Código único de acceso</p>
            </div>`
                : ''
            }
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#64748b;">Tipo</td><td style="padding:6px 0;text-align:right;font-weight:700;">${escapeHtml(seat)}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Evento</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(EVENT_META.name)}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Fecha</td><td style="padding:6px 0;text-align:right;">${escapeHtml(EVENT_META.date)}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Horario</td><td style="padding:6px 0;text-align:right;">${escapeHtml(EVENT_META.time)}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Lugar</td><td style="padding:6px 0;text-align:right;">${escapeHtml(EVENT_META.venue)}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Dirección</td><td style="padding:6px 0;text-align:right;">${escapeHtml(EVENT_META.address)}</td></tr>
              ${amount ? `<tr><td style="padding:6px 0;color:#64748b;">Monto</td><td style="padding:6px 0;text-align:right;">${escapeHtml(amount)}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#64748b;">Referencia</td><td style="padding:6px 0;text-align:right;font-size:12px;">${escapeHtml(reference)}</td></tr>
            </table>
          </div>
          <p style="margin:20px 0 0;font-size:13px;color:#64748b;">Muestra el QR en la entrada. Cada boleto es único y solo puede usarse una vez.</p>
          <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Shark Caribe · administrativo@sharkcaribe.co</p>
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

async function sendResendEmail({ apiKey, from, to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.message || `Resend respondió ${res.status}`)
  }
  return body
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Método no permitido.' })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!apiKey || !from || !supabaseUrl || !serviceKey || !anonKey) {
    return json(500, { error: 'Función no configurada (Resend o keys).' })
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'No autenticado.' })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) {
    return json(401, { error: 'Sesión inválida.' })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return json(403, { error: 'Solo administradores.' })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'JSON inválido.' })
  }

  const attendeeId = String(body.attendeeId || '').trim()
  if (!attendeeId) {
    return json(400, { error: 'Falta attendeeId.' })
  }

  const { data: record, error } = await admin
    .from('attendee_registrations')
    .select(
      'id, email, full_name, seat_type, ticket_number, ticket_token, amount_in_cents, payment_reference, status'
    )
    .eq('id', attendeeId)
    .maybeSingle()

  if (error) {
    console.error('[resend-ticket]', error)
    return json(500, { error: 'No se pudo leer el asistente.' })
  }
  if (!record) {
    return json(404, { error: 'Asistente no encontrado.' })
  }
  if (String(record.status || '').toLowerCase() !== 'pago') {
    return json(400, { error: 'El asistente aún no tiene pago confirmado.' })
  }

  const email = String(record.email || '').trim().toLowerCase()
  if (!email.includes('@')) {
    return json(400, { error: 'El registro no tiene correo válido.' })
  }

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

  const content = buildAttendeeTicketEmail({
    ...record,
    ticket_token: ticketToken,
  })

  try {
    await sendResendEmail({
      apiKey,
      from,
      to: [email],
      subject: content.subject,
      html: content.html,
    })
  } catch (err) {
    console.error('[resend-ticket] Resend', err)
    return json(502, {
      error: err instanceof Error ? err.message : 'No se pudo enviar el correo.',
    })
  }

  return json(200, {
    ok: true,
    to: email,
    ticket_number: record.ticket_number,
  })
})
