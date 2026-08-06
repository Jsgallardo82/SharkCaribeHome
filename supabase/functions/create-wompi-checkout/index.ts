import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SEAT_AMOUNTS = {
  preferencial: 7_990_000,
  general: 5_000_000,
}

const LEGAL_ID_TYPES = {
  TI: 'TI',
  CC: 'CC',
  CE: 'CE',
  passport: 'PP',
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function makeReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
  return `SC26-${stamp}-${rand}`
}

function siteOrigin(req, bodyOrigin) {
  if (bodyOrigin && /^https?:\/\//i.test(bodyOrigin)) {
    try {
      return new URL(bodyOrigin).origin
    } catch {
      /* ignore */
    }
  }
  const referer = req.headers.get('origin') || req.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin
    } catch {
      /* ignore */
    }
  }
  return null
}

Deno.serve(async (req) => {
  console.info('[create-wompi-checkout] request', {
    method: req.method,
    origin: req.headers.get('origin'),
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.warn('[create-wompi-checkout] método rechazado', req.method)
    return json(405, { error: 'Método no permitido.' })
  }

  const publicKey = Deno.env.get('WOMPI_PUBLIC_KEY')
  const integritySecret = Deno.env.get('WOMPI_INTEGRITY_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!publicKey || !integritySecret || !supabaseUrl || !serviceKey) {
    console.error('[create-wompi-checkout] Faltan secretos', {
      hasPublicKey: Boolean(publicKey),
      hasIntegrity: Boolean(integritySecret),
      hasUrl: Boolean(supabaseUrl),
      hasServiceKey: Boolean(serviceKey),
    })
    return json(500, {
      error: 'Pago no configurado en el servidor. Faltan secretos de Wompi/Supabase.',
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    console.warn('[create-wompi-checkout] JSON inválido')
    return json(400, { error: 'JSON inválido.' })
  }

  const seatType = body.seatType
  const amountInCents = SEAT_AMOUNTS[seatType]
  if (!amountInCents) {
    console.warn('[create-wompi-checkout] seatType inválido', seatType)
    return json(400, { error: 'Selecciona Preferencial o General.' })
  }

  const fullName = String(body.fullName || '').trim()
  const documentType = String(body.documentType || '').trim()
  const documentNumber = String(body.documentNumber || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const phone = String(body.phone || '').trim()
  const profile = String(body.profile || '').trim()
  const organization = String(body.organization || '').trim() || null
  const interest = String(body.interest || '').trim()
  const accompaniedCompetitorId = body.accompaniedCompetitorId || null
  const referralSource = String(body.referralSource || '').trim()
  const referralSourceOther =
    referralSource === 'other'
      ? String(body.referralSourceOther || '').trim()
      : null

  if (fullName.length < 3) {
    return json(400, { error: 'Escribe tu nombre completo.' })
  }
  if (!LEGAL_ID_TYPES[documentType]) {
    return json(400, { error: 'Tipo de documento inválido.' })
  }
  if (documentNumber.length < 5) {
    return json(400, { error: 'Número de documento inválido.' })
  }
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) {
    return json(400, { error: 'Correo electrónico inválido.' })
  }
  if (digitsOnly(phone).length < 7) {
    return json(400, { error: 'Celular inválido.' })
  }
  if (!profile || !interest || !referralSource) {
    return json(400, { error: 'Completa todos los campos obligatorios.' })
  }
  if (referralSource === 'other' && !referralSourceOther) {
    return json(400, { error: 'Especifica por qué medio te enteraste.' })
  }

  const reference = makeReference()
  const currency = 'COP'
  const signatureIntegrity = await sha256Hex(
    `${reference}${amountInCents}${currency}${integritySecret}`
  )

  const origin = siteOrigin(req, body.redirectOrigin)
  const redirectUrl = origin ? `${origin}/pago/resultado` : null

  console.info('[create-wompi-checkout] creando registro', {
    email,
    seatType,
    amountInCents,
    reference,
    redirectUrl,
  })

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const row = {
    full_name: fullName,
    document_type: documentType,
    document_number: documentNumber,
    email,
    phone,
    profile,
    organization,
    interest,
    seat_type: seatType,
    accompanied_competitor_id: accompaniedCompetitorId || null,
    referral_source: referralSource,
    referral_source_other: referralSourceOther,
    status: 'pending',
    payment_reference: reference,
    amount_in_cents: amountInCents,
  }

  const { data: inserted, error } = await supabase
    .from('attendee_registrations')
    .insert(row)
    .select('id, payment_reference, amount_in_cents, seat_type, email')
    .single()

  if (error) {
    console.error('[create-wompi-checkout] insert error', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    if (error.code === '23505') {
      return json(409, {
        error:
          'Ya existe un registro con ese correo o documento. Si ya te inscribiste, revisa tu correo o escríbenos.',
      })
    }
    return json(500, {
      error: 'No pudimos guardar tu registro. Inténtalo de nuevo.',
      detail: error.message,
    })
  }

  console.info('[create-wompi-checkout] OK', {
    registrationId: inserted.id,
    reference: inserted.payment_reference,
    amountInCents: inserted.amount_in_cents,
  })

  const phoneDigits = digitsOnly(phone)

  return json(200, {
    registrationId: inserted.id,
    publicKey,
    currency,
    amountInCents,
    reference,
    signatureIntegrity,
    redirectUrl,
    customerData: {
      email,
      fullName,
      phoneNumber: phoneDigits,
      phoneNumberPrefix: '+57',
      legalId: documentNumber,
      legalIdType: LEGAL_ID_TYPES[documentType],
    },
  })
})
