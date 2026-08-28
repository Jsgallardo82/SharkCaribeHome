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

function readNested(obj, path) {
  return path.split('.').reduce((acc, key) => {
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

async function verifyEventChecksum(event, eventsSecret) {
  const properties = event?.signature?.properties
  const checksum = (event?.signature?.checksum || '').toString().toUpperCase()
  const timestamp = event?.timestamp

  if (!Array.isArray(properties) || !checksum || timestamp == null) {
    return false
  }

  let concat = ''
  for (const prop of properties) {
    const value = readNested(event.data, prop)
    if (value === undefined || value === null) return false
    concat += String(value)
  }
  concat += String(timestamp)
  concat += eventsSecret

  const computed = await sha256Hex(concat)
  return computed === checksum
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

function buildPaymentConfirmEmail(table, record) {
  if (table === 'attendee_registrations') {
    return buildAttendeeTicketEmail(record)
  }

  const isSponsor = table === 'sponsor_registrations'
  const label = isSponsor ? 'Patrocinador' : 'Expositor muestra comercial'
  const name =
    record.contact_name || record.company_name || record.full_name || 'inscrito'
  const detail = isSponsor
    ? record.plan
      ? `Plan: ${record.plan}`
      : ''
    : record.stand_type
      ? `Stand: ${record.stand_type}`
      : ''
  const amount = formatAmount(record.amount_in_cents)

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#0d1a3d;line-height:1.5;max-width:560px;">
      <h2 style="margin:0 0 12px;">Pago confirmado · ${escapeHtml(label)}</h2>
      <p>Hola ${escapeHtml(name)},</p>
      <p>Confirmamos tu pago para <strong>${escapeHtml(label)}</strong> en Shark Caribe 2026.</p>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ''}
      ${amount ? `<p><strong>Monto:</strong> ${escapeHtml(amount)}</p>` : ''}
      <p style="color:#64748b;font-size:13px;">Referencia: ${escapeHtml(record.payment_reference || '—')}</p>
      <p style="color:#64748b;font-size:13px;">Shark Caribe · administrativo@sharkcaribe.co</p>
    </div>
  `

  return {
    subject: `Pago confirmado · ${label} · Shark Caribe`,
    html,
  }
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

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.warn('[wompi-webhook] método rechazado', req.method)
    return json(405, { error: 'Método no permitido.' })
  }

  const eventsSecret = Deno.env.get('WOMPI_EVENTS_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!eventsSecret || !supabaseUrl || !serviceKey) {
    console.error('[wompi-webhook] Faltan secretos', {
      hasEventsSecret: Boolean(eventsSecret),
      hasUrl: Boolean(supabaseUrl),
      hasServiceKey: Boolean(serviceKey),
    })
    return json(500, { error: 'Webhook no configurado.' })
  }

  let event
  try {
    event = await req.json()
  } catch {
    console.warn('[wompi-webhook] JSON inválido')
    return json(400, { error: 'JSON inválido.' })
  }

  console.info('[wompi-webhook] evento recibido', {
    event: event?.event,
    environment: event?.environment,
    reference: event?.data?.transaction?.reference,
    status: event?.data?.transaction?.status,
    transactionId: event?.data?.transaction?.id,
  })

  const headerChecksum = (req.headers.get('X-Event-Checksum') || '').toUpperCase()
  const bodyChecksum = (event?.signature?.checksum || '').toString().toUpperCase()
  if (headerChecksum && bodyChecksum && headerChecksum !== bodyChecksum) {
    console.warn('[wompi-webhook] Checksum header ≠ body')
    return json(401, { error: 'Checksum inconsistente.' })
  }

  const valid = await verifyEventChecksum(event, eventsSecret)
  if (!valid) {
    console.warn('[wompi-webhook] Checksum inválido — rechazo')
    return json(401, { error: 'Firma de evento inválida.' })
  }

  if (event.event !== 'transaction.updated') {
    console.info('[wompi-webhook] evento ignorado', event.event)
    return json(200, { ok: true, ignored: true })
  }

  const tx = event.data?.transaction
  if (!tx?.reference) {
    console.warn('[wompi-webhook] sin reference en transaction')
    return json(200, { ok: true, ignored: true })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const reference = String(tx.reference)
  const status = String(tx.status || '')
  const transactionId = tx.id ? String(tx.id) : null
  const amountInCents =
    typeof tx.amount_in_cents === 'number' ? tx.amount_in_cents : null

  const found = await findRegistrationByReference(supabase, reference)
  if (found.error) {
    return json(500, { error: 'Error al buscar registro.' })
  }

  const { table, row } = found
  if (!row || !table) {
    console.warn('[wompi-webhook] Referencia desconocida', reference)
    return json(200, { ok: true, unknownReference: true })
  }

  const rowStatus = normalizeStatus(row.status)

  if (
    amountInCents != null &&
    row.amount_in_cents != null &&
    Number(amountInCents) !== Number(row.amount_in_cents)
  ) {
    console.error('[wompi-webhook] Monto no coincide', {
      table,
      reference,
      expected: row.amount_in_cents,
      got: amountInCents,
    })
    return json(200, { ok: true, amountMismatch: true })
  }

  if (status === 'APPROVED') {
    if (rowStatus === 'pago') {
      console.info('[wompi-webhook] ya estaba en pago', {
        table,
        reference,
        transactionId,
        previousStatus: row.status,
      })
      return json(200, { ok: true, alreadyPaid: true, table })
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from(table)
      .update({
        status: 'pago',
        payment_confirmation: transactionId
          ? `WOMPI:${transactionId}`
          : 'WOMPI:APPROVED',
        wompi_transaction_id: transactionId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .select('id')

    if (updateError) {
      console.error('[wompi-webhook] update error', { table, updateError })
      return json(500, { error: 'No se pudo marcar el pago.' })
    }

    const updatedCount = Array.isArray(updatedRows) ? updatedRows.length : 0
    if (updatedCount === 0) {
      console.error('[wompi-webhook] UPDATE 0 filas', {
        table,
        id: row.id,
        reference,
        previousStatus: row.status,
      })
      return json(500, { error: 'No se actualizó ninguna fila.' })
    }

    console.info('[wompi-webhook] marcado como pago', {
      table,
      id: row.id,
      reference,
      transactionId,
      previousStatus: row.status,
      rows: updatedCount,
    })

    let emailResult = null
    try {
      const paidRecord = await fetchPaidRecord(supabase, table, row.id)
      if (paidRecord) {
        emailResult = await sendPaidEmail(table, paidRecord)
        console.info('[wompi-webhook] correo pago', {
          table,
          id: row.id,
          ticket_number: paidRecord.ticket_number ?? null,
          ...emailResult,
        })
      }
    } catch (err) {
      console.error('[wompi-webhook] Error enviando correo (pago ya marcado)', {
        table,
        id: row.id,
        error: err instanceof Error ? err.message : String(err),
      })
      emailResult = {
        error: err instanceof Error ? err.message : 'email_failed',
      }
    }

    return json(200, {
      ok: true,
      paid: true,
      table,
      rows: updatedCount,
      email: emailResult,
    })
  }

  console.warn('[wompi-webhook] transacción no aprobada', {
    table,
    reference,
    status,
    transactionId,
    previousStatus: row.status,
  })

  if (transactionId && rowStatus !== 'pago' && !row.wompi_transaction_id) {
    await supabase
      .from(table)
      .update({ wompi_transaction_id: transactionId })
      .eq('id', row.id)
  }

  return json(200, { ok: true, status, table })
})
