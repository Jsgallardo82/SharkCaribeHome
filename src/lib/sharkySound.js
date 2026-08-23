const SHARKY_SOUND_SRC =
  '/cyber-whoosh-confirmation-ding-brukowskij-1-00-04.mp3'

let audio = null

function getAudio() {
  if (typeof window === 'undefined') return null
  if (!audio) {
    audio = new Audio(SHARKY_SOUND_SRC)
    audio.preload = 'auto'
  }
  return audio
}

/** Reproduce el sonido de Sharky (reinicia si ya estaba sonando). */
export function playSharkySound() {
  const el = getAudio()
  if (!el) return

  try {
    el.currentTime = 0
  } catch {
    /* ignore seek errors before metadata */
  }

  const playPromise = el.play()
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      /* Autoplay bloqueado u otro error: se ignora en silencio */
    })
  }
}

/**
 * Reproduce en la primera interacción del usuario (clic/tap/tecla).
 * Devuelve una función de cleanup.
 */
export function installSharkySoundOnFirstGesture() {
  if (typeof window === 'undefined') return () => {}

  function onFirstGesture() {
    playSharkySound()
    cleanup()
  }

  function cleanup() {
    window.removeEventListener('pointerdown', onFirstGesture)
    window.removeEventListener('keydown', onFirstGesture)
  }

  window.addEventListener('pointerdown', onFirstGesture)
  window.addEventListener('keydown', onFirstGesture)

  return cleanup
}

/** Props para imágenes Sharky clickeables / accesibles / hover. */
export function sharkySoundInteractionProps() {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: playSharkySound,
    onMouseEnter: playSharkySound,
    onFocus: playSharkySound,
    onKeyDown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        playSharkySound()
      }
    },
  }
}

export { SHARKY_SOUND_SRC }
