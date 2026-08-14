/**
 * Notifica por correo (Resend) cuando hay una inscripción abierta:
 * asistente, patrocinador o expositor.
 *
 * Destinatarios:
 * - el correo del inscrito
 * - administrativo@sharkcaribe.co
 *
 * Secrets:
 * - RESEND_API_KEY
 * - RESEND_FROM  (ej. "Shark Caribe <noreply@tudominio.com>")
 * - NOTIFY_ADMIN_EMAIL (opcional, default administrativo@sharkcaribe.co)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const KIND_LABELS: Record<string, string> = {
  asistente: 'Asistente',
  patrocinador: 'Patrocinador',
  expositor: 'Expositor muestra comercial',
  attendee_registrations: 'Asistente',
  sponsor_registrations: 'Patrocinador',
  exhibitor_registrations: 'Expositor muestra comercial',
}

const OPEN_KINDS = new Set([
  'asistente',
  'patrocinador',
  'expositor',
  'attendee_registrations',
  'sponsor_registrations',
  'exhibitor_registrations',
])

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pickEmail(record: Record<string, unknown>) {
  const email = String(record.email || '').trim().toLowerCase()
  return email.includes('@') ? email : ''
}

function fieldRows(record: Record<string, unknown>) {
  const preferred = [
    ['full_name', 'Nombre'],
    ['contact_name', 'Contacto'],
    ['company_name', 'Empresa'],
    ['email', 'Correo'],
    ['phone', 'Teléfono'],
    ['plan', 'Plan'],
    ['seat_type', 'Ubicación'],
    ['stand_type', 'Tipo de stand'],
    ['sector', 'Sector'],
    ['profile', 'Perfil'],
    ['interest', 'Interés'],
    ['organization', 'Organización'],
    ['document_type', 'Tipo de documento'],
    ['document_number', 'Documento'],
    ['tax_id', 'NIT / documento fiscal'],
    ['website', 'Sitio web'],
    ['comments', 'Comentarios'],
  ] as const

  const rows: string[] = []
  for (const [key, label] of preferred) {
    const value = record[key]
    if (value == null || value === '') continue
    rows.push(
      `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;"><strong>${label}</strong></td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`
    )
  }
  return rows.join('')
}

function buildEmails(kindKey: string, record: Record<string, unknown>) {
  const label = KIND_LABELS[kindKey] || 'Inscripción'
  const name =
    record.full_name ||
    record.contact_name ||
    record.company_name ||
    'inscrito'
  const rows = fieldRows(record)

  const registrantHtml = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#0d1a3d;line-height:1.5;">
      <h2 style="margin:0 0 12px;">Recibimos tu inscripción</h2>
      <p>Hola ${escapeHtml(name)},</p>
      <p>Confirmamos que recibimos tu registro como <strong>${escapeHtml(label)}</strong> en Shark Caribe.</p>
      <p>Nuestro equipo revisará la información y te contactará si hace falta algún paso adicional (pago o documentos).</p>
      <table style="border-collapse:collapse;width:100%;max-width:560px;margin:16px 0;">${rows}</table>
      <p style="color:#64748b;font-size:13px;">Shark Caribe · administrativo@sharkcaribe.co</p>
    </div>
  `

  const adminHtml = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#0d1a3d;line-height:1.5;">
      <h2 style="margin:0 0 12px;">Nueva inscripción · ${escapeHtml(label)}</h2>
      <p>Se registró un nuevo <strong>${escapeHtml(label)}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;max-width:560px;margin:16px 0;">${rows}</table>
    </div>
  `

  return {
    label,
    registrantSubject: `Inscripción recibida · ${label} · Shark Caribe`,
    adminSubject: `Nueva inscripción · ${label} · Shark Caribe`,
    registrantHtml,
    adminHtml,
  }
}

async function sendResendEmail(opts: {
  apiKey: string
  from: string
  to: string[]
  subject: string
  html: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      body?.message || `Resend respondió ${res.status}`
    )
  }
  return body
}

function normalizePayload(body: Record<string, unknown>) {
  /* Formato Database Webhook de Supabase */
  if (body.type === 'INSERT' && body.table && body.record) {
    return {
      kind: String(body.table),
      record: body.record as Record<string, unknown>,
    }
  }

  /* Formato desde el cliente */
  return {
    kind: String(body.kind || ''),
    record: (body.record || {}) as Record<string, unknown>,
  }
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
  const adminEmail =
    Deno.env.get('NOTIFY_ADMIN_EMAIL') || 'administrativo@sharkcaribe.co'

  if (!apiKey || !from) {
    console.error('[notify-registration] Faltan RESEND_API_KEY o RESEND_FROM')
    return json(500, { error: 'Correo no configurado.' })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'JSON inválido.' })
  }

  const { kind, record } = normalizePayload(body)
  if (!OPEN_KINDS.has(kind)) {
    return json(200, { skipped: true, reason: 'modalidad no notificada' })
  }

  const registrantEmail = pickEmail(record)
  if (!registrantEmail) {
    return json(400, { error: 'Falta el correo del inscrito.' })
  }

  const content = buildEmails(kind, record)

  try {
    await sendResendEmail({
      apiKey,
      from,
      to: [registrantEmail],
      subject: content.registrantSubject,
      html: content.registrantHtml,
    })

    await sendResendEmail({
      apiKey,
      from,
      to: [adminEmail],
      subject: content.adminSubject,
      html: content.adminHtml,
    })
  } catch (err) {
    console.error('[notify-registration] Error Resend', err)
    return json(502, {
      error: err instanceof Error ? err.message : 'No se pudo enviar el correo.',
    })
  }

  return json(200, { ok: true, kind, to: [registrantEmail, adminEmail] })
})
