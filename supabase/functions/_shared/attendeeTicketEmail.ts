/**
 * Plantilla HTML del boleto de asistente (correo Resend).
 * Usada por wompi-webhook y resend-ticket.
 */

export const EVENT_META = {
  name: 'Shark Caribe Pitch Competition 2026',
  date: '25 de noviembre de 2026',
  time: '5:00 p. m. – 9:45 p. m.',
  venue: 'Hotel Dann Carlton · Barranquilla',
  address: 'Calle 98 No. 52B-10, Riomar',
}

export const SEAT_LABELS = {
  preferencial: 'Preferencial',
  general: 'General',
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatAmount(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return null
  const pesos = Number(cents) / 100
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pesos)
}

export function qrImageUrl(token) {
  const payload = String(token || '').trim()
  if (!payload) return ''
  const data = encodeURIComponent(payload)
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${data}`
}

export function buildAttendeeTicketEmail(record) {
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
