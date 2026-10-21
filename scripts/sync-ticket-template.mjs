#!/usr/bin/env node
/**
 * Sincroniza la plantilla del ticket desde la fuente única
 *   src/lib/attendeeTicketEmail.js
 * hacia las tres copias que la necesitan:
 *   - supabase/functions/_shared/attendeeTicketEmail.ts
 *   - supabase/functions/wompi-webhook/index.ts   (entre marcadores)
 *   - supabase/functions/resend-ticket/index.ts   (entre marcadores)
 *
 * A diferencia de regen-ticket-functions.mjs (que está desactivado porque
 * reescribía las funciones enteras y revertía el soporte de compra
 * múltiple), este script SOLO toca lo que hay entre los marcadores
 * `===== plantilla ticket =====` y `===== fin plantilla =====`.
 * La lógica de cada Edge Function queda intacta.
 *
 * Uso:  node scripts/sync-ticket-template.mjs
 */

import fs from 'node:fs'

const FUENTE = 'src/lib/attendeeTicketEmail.js'
const COMPARTIDO = 'supabase/functions/_shared/attendeeTicketEmail.ts'
const FUNCIONES = [
  'supabase/functions/wompi-webhook/index.ts',
  'supabase/functions/resend-ticket/index.ts',
]

const INICIO = '/* ===== plantilla ticket (inline Dashboard) ===== */'
const FIN = '/* ===== fin plantilla ===== */'

const canon = fs.readFileSync(FUENTE, 'utf8')

/* Las copias de Deno van inline, sin import/export: se quita el comentario
   de cabecera y los `export` de cada declaración. */
const plantilla = canon
  .replace(/^\/\*\*[\s\S]*?\*\/\s*/, '')
  .replace(/^export /gm, '')

if (!plantilla.includes('function buildAttendeeTicketEmail')) {
  console.error('No encuentro buildAttendeeTicketEmail en', FUENTE)
  process.exit(1)
}

fs.writeFileSync(
  COMPARTIDO,
  '/** Plantilla del boleto (correo Resend). Sync desde ' +
    FUENTE +
    '\n *  Generado por scripts/sync-ticket-template.mjs — no editar a mano. */\n\n' +
    plantilla
)
console.log('✓', COMPARTIDO)

for (const f of FUNCIONES) {
  const t = fs.readFileSync(f, 'utf8')
  const i = t.indexOf(INICIO)
  const j = t.indexOf(FIN)
  if (i < 0 || j < 0 || j < i) {
    console.error('✗ marcadores de plantilla no encontrados en', f)
    process.exit(1)
  }
  const nuevo =
    t.slice(0, i) + INICIO + '\n' + plantilla + FIN + t.slice(j + FIN.length)
  fs.writeFileSync(f, nuevo)
  console.log('✓', f)
}

console.log('\nRecuerda desplegar wompi-webhook y resend-ticket en Supabase.')
