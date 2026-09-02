import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const jsPath = path.join(root, 'src/lib/attendeeTicketEmail.js')
const js = fs.readFileSync(jsPath, 'utf8')

const start = js.indexOf('export const EVENT_META')
const fnStart = js.indexOf('export function buildAttendeeTicketEmail')
const subjectIdx = js.lastIndexOf('subject:')
if (start < 0 || fnStart < 0 || subjectIdx < 0) {
  throw new Error(`markers: start=${start} fn=${fnStart} subject=${subjectIdx}`)
}
const afterFn = js.indexOf('\n}', subjectIdx) + 2

let block = js.slice(start, afterFn)
block = block
  .replace(/^export /gm, '')
  .replace(/const SAMPLE_TICKET_PREFERENCIAL = \{[\s\S]*?\}\r?\n\r?\n/g, '')
  .replace(/const SAMPLE_TICKET_GENERAL = \{[\s\S]*?\}\r?\n\r?\n/g, '')
  .replace(/\/\*\* @deprecated[\s\S]*?\r?\n\r?\n/g, '')

const windowRe =
  /function buildAttendeeTicketEmail\(record, options = \{\}\) \{\r?\n  const baseUrl =\r?\n    options\.baseUrl \|\|\r?\n    \(typeof window !== 'undefined' && window\.location\?\.origin\r?\n      \? window\.location\.origin\r?\n      : ''\)\r?\n/

block = block.replace(
  windowRe,
  "function buildAttendeeTicketEmail(record, options = {}) {\n  const baseUrl = String(options.baseUrl || '').replace(/\\/$/, '')\n"
)

if (block.includes('typeof window')) {
  throw new Error('No se pudo adaptar baseUrl (sigue window)')
}

const sharedPath = path.join(root, 'supabase/functions/_shared/attendeeTicketEmail.ts')
fs.writeFileSync(
  sharedPath,
  '/** Plantilla del boleto (correo Resend). Sync desde src/lib/attendeeTicketEmail.js */\n\n' +
    block.trim() +
    '\n'
)
console.log('OK shared', block.length)

function patchEdge(rel) {
  const file = path.join(root, rel)
  let src = fs.readFileSync(file, 'utf8')
  const a = '/* ===== plantilla ticket (inline Dashboard) ===== */'
  const b = '/* ===== fin plantilla ===== */'
  const i = src.indexOf(a)
  const j = src.indexOf(b)
  if (i < 0 || j < 0) throw new Error('Marcadores faltan en ' + rel)
  const plantilla = a + '\n' + block.trim() + '\n\n' + b
  src = src.slice(0, i) + plantilla + src.slice(j + b.length)
  fs.writeFileSync(file, src)
  console.log('OK', rel)
}

patchEdge('supabase/functions/wompi-webhook/index.ts')
patchEdge('supabase/functions/resend-ticket/index.ts')
