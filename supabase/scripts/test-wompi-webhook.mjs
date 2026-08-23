/**
 * Simula un evento Wompi APPROVED sin pagar de verdad.
 *
 * Uso (PowerShell):
 *   $env:WOMPI_EVENTS_SECRET="tu_events_secret"
 *   $env:PAYMENT_REFERENCE="SC26-ASI-...."
 *   node supabase/scripts/test-wompi-webhook.mjs
 *
 * Opcional:
 *   $env:AMOUNT_IN_CENTS="7990000"
 *   $env:WEBHOOK_URL="https://jcrjvtpylprlcvojxuvw.supabase.co/functions/v1/wompi-webhook"
 *
 * Antes: pon la fila en pending (si ya la marcaste pago a mano):
 *   UPDATE ... SET status='pending', payment_confirmation=null,
 *     wompi_transaction_id=null WHERE payment_reference='...';
 */

import { createHash } from 'node:crypto'

const eventsSecret = process.env.WOMPI_EVENTS_SECRET
const reference = process.env.PAYMENT_REFERENCE
const amountInCents = Number(process.env.AMOUNT_IN_CENTS || '7990000')
const webhookUrl =
  process.env.WEBHOOK_URL ||
  'https://jcrjvtpylprlcvojxuvw.supabase.co/functions/v1/wompi-webhook'

if (!eventsSecret) {
  console.error('Falta WOMPI_EVENTS_SECRET')
  process.exit(1)
}
if (!reference) {
  console.error('Falta PAYMENT_REFERENCE (el de tu fila en Supabase)')
  process.exit(1)
}

const transactionId = `test-${Date.now()}`
const timestamp = Math.floor(Date.now() / 1000)

const event = {
  event: 'transaction.updated',
  environment: 'test',
  timestamp,
  data: {
    transaction: {
      id: transactionId,
      status: 'APPROVED',
      reference,
      amount_in_cents: amountInCents,
      currency: 'COP',
    },
  },
  signature: {
    properties: [
      'transaction.id',
      'transaction.status',
      'transaction.amount_in_cents',
    ],
    checksum: '',
  },
}

const concat =
  String(event.data.transaction.id) +
  String(event.data.transaction.status) +
  String(event.data.transaction.amount_in_cents) +
  String(timestamp) +
  eventsSecret

event.signature.checksum = createHash('sha256')
  .update(concat)
  .digest('hex')
  .toUpperCase()

console.log('POST', webhookUrl)
console.log('reference', reference)
console.log('amount_in_cents', amountInCents)
console.log('transaction.id', transactionId)

const res = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Event-Checksum': event.signature.checksum,
  },
  body: JSON.stringify(event),
})

const text = await res.text()
console.log('HTTP', res.status)
console.log(text)

if (!res.ok) {
  console.error(
    '\nSi ves checksum inválido: revisa WOMPI_EVENTS_SECRET (mismo que en la Edge Function).'
  )
  process.exit(1)
}

console.log(
  '\nOK. En Table Editor la fila debe tener status=pago y payment_confirmation=WOMPI:' +
    transactionId
)
