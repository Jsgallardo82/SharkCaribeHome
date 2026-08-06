import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-event-checksum',
}

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

async function verifyEventChecksum(event, eventsSecret) {
  const properties = event?.signature?.properties
  const checksum = (
    event?.signature?.checksum ||
    ''
  ).toString().toUpperCase()
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

  const { data: row, error: findError } = await supabase
    .from('attendee_registrations')
    .select('id, status, amount_in_cents, wompi_transaction_id')
    .eq('payment_reference', reference)
    .maybeSingle()

  if (findError) {
    console.error('[wompi-webhook] find error', findError)
    return json(500, { error: 'Error al buscar registro.' })
  }

  if (!row) {
    console.warn('[wompi-webhook] Referencia desconocida', reference)
    return json(200, { ok: true, unknownReference: true })
  }

  if (
    amountInCents != null &&
    row.amount_in_cents != null &&
    amountInCents !== row.amount_in_cents
  ) {
    console.error('[wompi-webhook] Monto no coincide', {
      reference,
      expected: row.amount_in_cents,
      got: amountInCents,
    })
    return json(200, { ok: true, amountMismatch: true })
  }

  if (status === 'APPROVED') {
    if (row.status === 'pago') {
      console.info('[wompi-webhook] ya estaba en pago', { reference, transactionId })
      return json(200, { ok: true, alreadyPaid: true })
    }

    const { error: updateError } = await supabase
      .from('attendee_registrations')
      .update({
        status: 'pago',
        payment_confirmation: transactionId
          ? `WOMPI:${transactionId}`
          : 'WOMPI:APPROVED',
        wompi_transaction_id: transactionId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('status', 'pending')

    if (updateError) {
      console.error('[wompi-webhook] update error', updateError)
      return json(500, { error: 'No se pudo marcar el pago.' })
    }

    console.info('[wompi-webhook] marcado como pago', {
      id: row.id,
      reference,
      transactionId,
    })
    return json(200, { ok: true, paid: true })
  }

  console.warn('[wompi-webhook] transacción no aprobada', {
    reference,
    status,
    transactionId,
  })

  if (transactionId && row.status === 'pending' && !row.wompi_transaction_id) {
    await supabase
      .from('attendee_registrations')
      .update({ wompi_transaction_id: transactionId })
      .eq('id', row.id)
  }

  return json(200, { ok: true, status })
})
