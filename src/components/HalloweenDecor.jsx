import { useEffect } from 'react'
import { isHalloweenActive } from '../data/content.js'
import './HalloweenDecor.css'

/* Telaraña de esquina. El trazo usa currentColor para que el color
   lo decida el CSS según dónde esté puesta. */
function Telarana({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M0 0 L120 0 M0 0 L112 42 M0 0 L85 85 M0 0 L42 112 M0 0 L0 120" />
        <path d="M28 0 Q 21 21 0 28" />
        <path d="M52 0 Q 38 38 0 52" />
        <path d="M78 0 Q 56 56 0 78" />
        <path d="M104 0 Q 75 75 0 104" />
      </g>
    </svg>
  )
}

/* Dos capas a propósito: el <span> vuela (translate) y el <svg> aletea
   (scaleY). Si las dos animaciones van sobre el mismo elemento, ambas
   escriben `transform` y la última gana — el aleteo borraba el vuelo y
   los murciélagos se quedaban clavados en el borde izquierdo. */
function Murcielago({ className }) {
  return (
    <span className={className}>
      {/* viewBox 120x56 (2.1:1). El anterior era 100x32 — tan achatado
          que leía como bigote. Se arma por piezas (orejas, cuerpo, alas)
          en vez de un solo path: es más fácil de ajustar y queda simétrico. */}
      <svg className="hw__bat-ala" viewBox="0 0 120 56" aria-hidden="true">
        <g fill="currentColor">
          <path d="M54 18 L52 3 L61 14 Z" />
          <path d="M66 18 L68 3 L59 14 Z" />
          <ellipse cx="60" cy="30" rx="8" ry="13" />
          <path
            d="M53 21 C44 13 30 9 16 12 C9 14 4 18 0 24 C7 23 13 25 17 29
               C11 31 7 35 5 41 C12 38 19 38 25 41 C23 45 22 49 23 54
               C31 45 42 39 53 39 Z"
          />
          <path
            d="M67 21 C76 13 90 9 104 12 C111 14 116 18 120 24 C113 23 107 25 103 29
               C109 31 113 35 115 41 C108 38 101 38 95 41 C97 45 98 49 97 54
               C89 45 78 39 67 39 Z"
          />
        </g>
      </svg>
    </span>
  )
}

function Calabaza({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 60" aria-hidden="true">
      <path
        d="M32 10c-1 0-2-3-1-6 2 1 4 0 6-2 0 4-2 7-5 8z"
        fill="#4b8b3b"
      />
      <ellipse cx="32" cy="34" rx="27" ry="24" fill="currentColor" />
      <ellipse cx="14" cy="34" rx="11" ry="23" fill="#000" opacity=".1" />
      <ellipse cx="50" cy="34" rx="11" ry="23" fill="#000" opacity=".1" />
      {/* ojos y boca recortados en negro para que se lea como farol */}
      <path d="M18 27 L28 31 L18 35 Z" fill="#1a0f05" />
      <path d="M46 27 L36 31 L46 35 Z" fill="#1a0f05" />
      <path
        d="M17 42 q5 7 10 2 q5 7 10 0 q5 5 10 -2 q-4 11 -15 11 t-15 -11z"
        fill="#1a0f05"
      />
    </svg>
  )
}

/**
 * Capa de decoración de Halloween.
 *
 * Todo va en position:fixed con pointer-events:none, así cubre la página
 * completa sin tocar el layout de ninguna sección y sin bloquear clics.
 * El z-index (90) la deja por encima del contenido pero por debajo del
 * navbar (100) y del modal de compra (200), que queda limpio a propósito.
 *
 * Se monta sola solo dentro de la ventana de fechas de content.js.
 */
export default function HalloweenDecor() {
  const activo = isHalloweenActive()

  /* El atributo en <html> es lo que enciende los acentos naranja y el
     brillo de los títulos; todo ese CSS está scopeado a [data-halloween]. */
  useEffect(() => {
    if (!activo) return undefined
    const raiz = document.documentElement
    raiz.dataset.halloween = 'true'
    return () => {
      delete raiz.dataset.halloween
    }
  }, [activo])

  if (!activo) return null

  return (
    <div className="hw" aria-hidden="true">
      <Telarana className="hw__web hw__web--tl" />
      <Telarana className="hw__web hw__web--tr" />
      <Telarana className="hw__web hw__web--bl" />

      <Murcielago className="hw__bat hw__bat--1" />
      <Murcielago className="hw__bat hw__bat--2" />
      <Murcielago className="hw__bat hw__bat--3" />
      <Murcielago className="hw__bat hw__bat--4" />

      <Calabaza className="hw__pumpkin hw__pumpkin--1" />
      <Calabaza className="hw__pumpkin hw__pumpkin--2" />

      <div className="hw__fog" />
    </div>
  )
}
