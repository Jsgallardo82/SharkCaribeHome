/**
 * @typedef {{ Embeds: { process: () => void } }} Instgrm
 */

/**
 * @typedef {Window & { instgrm?: Instgrm }} InstagramWindow
 */

const EMBED_SCRIPT_SRC = 'https://www.instagram.com/embed.js'
const EMBED_SCRIPT_SELECTOR = 'script[src*="instagram.com/embed.js"]'

/** @returns {Instgrm | undefined} */
function getInstgrm() {
  if (typeof window === 'undefined') return undefined
  return /** @type {InstagramWindow} */ (window).instgrm
}

/**
 * Carga embed.js una sola vez (async + defer).
 * @returns {Promise<void>}
 */
export function ensureInstagramEmbedScript() {
  if (typeof document === 'undefined') return Promise.resolve()

  if (getInstgrm()?.Embeds?.process) {
    return Promise.resolve()
  }

  const existing = document.querySelector(EMBED_SCRIPT_SELECTOR)
  if (existing) {
    return new Promise((resolve) => {
      if (getInstgrm()?.Embeds?.process) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      /* Si el script ya cargó pero instgrm aún no está listo */
      window.setTimeout(() => resolve(), 400)
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = EMBED_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('No se pudo cargar el script de Instagram embeds.'))
    document.body.appendChild(script)
  })
}

/**
 * Procesa blockquotes.instagram-media en el DOM.
 * @param {number} [delayMs=200]
 */
export function processInstagramEmbeds(delayMs = 200) {
  if (typeof window === 'undefined') return

  window.setTimeout(() => {
    try {
      getInstgrm()?.Embeds?.process?.()
    } catch (err) {
      console.warn('[Shark Caribe] Instagram Embeds.process falló:', err)
    }
  }, delayMs)
}

/**
 * Asegura el script y procesa embeds (delay 100–300 ms para el DOM).
 * @param {number} [delayMs=200]
 * @returns {Promise<void>}
 */
export async function loadAndProcessInstagramEmbeds(delayMs = 200) {
  await ensureInstagramEmbedScript()
  processInstagramEmbeds(delayMs)
}
