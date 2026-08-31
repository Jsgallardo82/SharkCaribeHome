import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', 'supabase', 'functions')
const shared = fs
  .readFileSync(path.join(root, '_shared', 'attendeeTicketEmail.ts'), 'utf8')
  .replace(/^\/\*\*[\s\S]*?\*\/\s*/, '')
  .replace(/export /g, '')

const wompi = `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/* ===== plantilla ticket (inline Dashboard) ===== */
${shared}
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
  ).replace(/\\/$/, '')
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
`

const resend = `/**
 * Reenvía el correo del ticket (con QR).
 * Body: { attendeeId: uuid }
 * Secrets: RESEND_API_KEY, RESEND_FROM, PUBLIC_SITE_URL
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/* ===== plantilla ticket (inline Dashboard) ===== */
${shared}
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

function ticketBaseUrl() {
  return (Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || '').replace(/\\/$/, '')
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

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) return json(401, { error: 'Sesión inválida.' })

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') return json(403, { error: 'Solo administradores.' })

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
`

fs.writeFileSync(path.join(root, 'wompi-webhook', 'index.ts'), wompi)
fs.writeFileSync(path.join(root, 'resend-ticket', 'index.ts'), resend)
console.log('regenerated edge functions')
