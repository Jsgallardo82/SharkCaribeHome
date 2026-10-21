#!/usr/bin/env node
/**
 * Simula un evento `transaction.updated` de Wompi contra tu Edge Function,
 * firmado igual que los de verdad. Sirve para probar que el webhook marca
 * TODAS las boletas de una compra, sin pasar por Wompi ni gastar dinero.
 *
 * Uso:
 *   WOMPI_EVENTS_SECRET=xxx node scripts/test-webhook-multiboleta.mjs \
 *     --url https://TU_PROJECT.supabase.co/functions/v1/wompi-webhook \
 *     --reference SC26-ASI-... \
 *     --amount 15000000
 *
 *   --amount es el TOTAL en centavos (la suma de las boletas del grupo).
 *   --status APPROVED | DECLINED | VOIDED   (por defecto APPROVED)
 *
 * ⚠️ Con APPROVED el webhook envía CORREOS REALES por Resend a las
 *    direcciones de esas filas. Usa datos de prueba con tu propio correo.
 */

import { createHash } from 'node:crypto'

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const url = arg('url')
const reference = arg('reference')
const amount = Number(arg('amount'))
const status = arg('status', 'APPROVED')
const secret = process.env.WOMPI_EVENTS_SECRET

const missing = []
if (!url) missing.push('--url')
if (!reference) missing.push('--reference')
if (!Number.isFinite(amount) || amount <= 0) missing.push('--amount (entero, en centavos)')
if (!secret) missing.push('WOMPI_EVENTS_SECRET (variable de entorno)')

if (missing.length) {
  console.error('Faltan datos:\n  ' + missing.join('\n  '))
  console.error('\nEl events secret está en Supabase → Edge Functions → Secrets.')
  process.exit(1)
}

/* El webhook reconstruye la firma leyendo estas rutas dentro de event.data,
   las concatena, y le suma timestamp + secret. Ver verifyEventChecksum(). */
const properties = [
  'transaction.id',
  'transaction.status',
  'transaction.amount_in_cents',
]

const data = {
  transaction: {
    id: `TEST-${Date.now()}`,
    status,
    amount_in_cents: amount,
    reference,
    currency: 'COP',
  },
}

function readNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

const timestamp = Math.floor(Date.now() / 1000)

let concat = ''
for (const prop of properties) concat += String(readNested(data, prop))
concat += String(timestamp)
concat += secret

const checksum = createHash('sha256').update(concat, 'utf8').digest('hex').toUpperCase()

const event = {
  event: 'transaction.updated',
  data,
  sent_at: new Date().toISOString(),
  timestamp,
  signature: { properties, checksum },
  environment: 'test',
}

console.log('→ POST', url)
console.log('  referencia:', reference)
console.log('  estado:    ', status)
console.log('  monto:     ', amount, 'centavos ($' + (amount / 100).toLocaleString('es-CO') + ')')
console.log('  tx id:     ', data.transaction.id)
console.log('')

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Event-Checksum': checksum,
  },
  body: JSON.stringify(event),
})

const body = await res.text()
console.log('← HTTP', res.status)
try {
  const parsed = JSON.parse(body)
  console.log(JSON.stringify(parsed, null, 2))
  if (parsed.paid) {
    console.log(`\n✓ Marcó ${parsed.rows} boleta(s) como pagas.`)
    console.log('  Verifica en SQL que todas tengan ticket_number asignado.')
  }
  if (parsed.amountMismatch) {
    console.log('\n✗ El monto no coincide con la suma del grupo. Revisa --amount.')
  }
  if (parsed.unknownReference) {
    console.log('\n✗ Esa referencia no existe en ninguna tabla.')
  }
} catch {
  console.log(body)
}

if (res.status === 401) {
  console.log('\n✗ Firma inválida: el WOMPI_EVENTS_SECRET no coincide con el de la función.')
}
