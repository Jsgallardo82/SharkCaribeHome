import './Ticket.css'

/* Patrón de anchos de barras (determinista) para el código de barras */
const BAR_PATTERN = [
  3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 1, 3, 1,
  2, 2, 1, 1, 3, 1, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2,
]

export function Barcode({ variant = 'dark', className = '' }) {
  let x = 0
  const rects = []
  BAR_PATTERN.forEach((w, i) => {
    if (i % 2 === 0) {
      rects.push(<rect key={i} x={x} y="0" width={w} height="24" />)
    }
    x += w + 1
  })
  return (
    <svg
      className={`barcode barcode--${variant} ${className}`}
      viewBox={`0 0 ${x} 24`}
      preserveAspectRatio="none"
      role="img"
      aria-label="código de barras"
    >
      {rects}
    </svg>
  )
}

/**
 * Ticket reutilizable con estética de boleto.
 * - children: contenido del cuerpo (parte blanca)
 * - stub: contenido de la colilla (parte azul, opcional)
 * - notchBg: color de las muescas (debe coincidir con el fondo detrás del ticket)
 */
export default function Ticket({ children, stub, className = '', notchBg }) {
  const style = notchBg ? { '--notch-bg': notchBg } : undefined
  return (
    <div className={`ticket ${className}`} style={style}>
      <div className="ticket__main">{children}</div>
      {stub != null && (
        <>
          <div className="ticket__perf" aria-hidden="true" />
          <div className="ticket__stub">{stub}</div>
        </>
      )}
    </div>
  )
}
