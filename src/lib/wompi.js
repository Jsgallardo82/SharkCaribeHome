/* Helpers de checkout Wompi (Web Checkout por redirección). */

const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/'

export function isWompiConfigured() {
  return Boolean(import.meta.env.VITE_WOMPI_PUBLIC_KEY)
}

/**
 * Pago online visible solo con llave pública + flag explícito.
 * Por defecto OFF hasta que Wompi active Producción.
 * Para reactivar: VITE_WOMPI_PAYMENTS_ENABLED=true
 */
export function isWompiPaymentsEnabled() {
  const flag = String(import.meta.env.VITE_WOMPI_PAYMENTS_ENABLED || '')
    .trim()
    .toLowerCase()
  return isWompiConfigured() && (flag === 'true' || flag === '1' || flag === 'yes')
}

function isLocalOrigin(urlString) {
  try {
    const u = new URL(urlString)
    return (
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '[::1]' ||
      u.protocol === 'http:'
    )
  } catch {
    return true
  }
}

/**
 * Abre el Web Checkout de Wompi con un form GET (navegación completa).
 *
 * Nota: en local NO enviamos redirect-url. CloudFront de Wompi suele responder
 * 403 "Request blocked" si el redirect apunta a http://localhost.
 */
export function redirectToWompiCheckout(checkout) {
  if (typeof document === 'undefined') {
    throw new Error('Wompi solo está disponible en el navegador.')
  }

  const publicKey = checkout.publicKey || import.meta.env.VITE_WOMPI_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('Falta la llave pública de Wompi.')
  }
  if (!checkout.reference || !checkout.signatureIntegrity || !checkout.amountInCents) {
    throw new Error('Faltan datos firmados del checkout.')
  }

  const fields = {
    'public-key': publicKey,
    currency: checkout.currency || 'COP',
    'amount-in-cents': String(checkout.amountInCents),
    reference: checkout.reference,
    'signature:integrity': checkout.signatureIntegrity,
  }

  // Solo redirect HTTPS público (producción / túnel). Nunca localhost ni http.
  if (checkout.redirectUrl && !isLocalOrigin(checkout.redirectUrl)) {
    fields['redirect-url'] = checkout.redirectUrl
  } else if (checkout.redirectUrl) {
    console.warn(
      '[Shark Caribe][Wompi] Se omite redirect-url en local (CloudFront bloquea localhost). ' +
        'Tras pagar, revisa Admin o usa un túnel HTTPS (ngrok) para volver al sitio.'
    )
  }

  // Datos del cliente (opcionales). Si CloudFront vuelve a bloquear, se pueden omitir.
  const customer = checkout.customerData || {}
  if (customer.email) fields['customer-data:email'] = customer.email
  if (customer.fullName) fields['customer-data:full-name'] = customer.fullName
  if (customer.phoneNumber) fields['customer-data:phone-number'] = customer.phoneNumber
  if (customer.phoneNumberPrefix) {
    fields['customer-data:phone-number-prefix'] = customer.phoneNumberPrefix
  }
  if (customer.legalId) fields['customer-data:legal-id'] = customer.legalId
  if (customer.legalIdType) fields['customer-data:legal-id-type'] = customer.legalIdType

  console.info('[Shark Caribe][Wompi] Redirigiendo a Web Checkout', {
    reference: checkout.reference,
    amountInCents: checkout.amountInCents,
    hasRedirect: Boolean(fields['redirect-url']),
  })

  const form = document.createElement('form')
  form.method = 'GET'
  form.action = WOMPI_CHECKOUT_URL
  form.style.display = 'none'
  form.acceptCharset = 'UTF-8'

  for (const [name, value] of Object.entries(fields)) {
    if (value == null || value === '') continue
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = String(value)
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}

/** Mensaje legible si el backend/devtools devolvió HTML (CloudFront, etc.). */
export function friendlyWompiError(error) {
  const raw = String(error?.message || error || '')
  if (/<!DOCTYPE|<html|CloudFront|Request blocked/i.test(raw)) {
    return (
      'Wompi/CloudFront bloqueó el checkout (403). En local no uses redirect a localhost; ' +
      'prueba de nuevo o desde una URL HTTPS pública.'
    )
  }
  return raw || 'No pudimos abrir el pago. Inténtalo de nuevo.'
}
