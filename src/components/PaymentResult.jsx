import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isWompiConfigured } from '../lib/wompi.js'
import './PaymentResult.css'

function wompiApiBase(publicKey) {
  return String(publicKey || '').startsWith('pub_prod_')
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1'
}

const STATUS_COPY = {
  APPROVED: {
    title: '¡Pago aprobado!',
    body: 'Tu entrada quedó confirmada. Guarda el comprobante de Wompi y revisa tu correo por si te enviamos más detalles del evento.',
  },
  DECLINED: {
    title: 'Pago rechazado',
    body: 'La transacción no fue aprobada. Puedes volver a Entradas e intentarlo con otro medio de pago.',
  },
  VOIDED: {
    title: 'Pago anulado',
    body: 'La transacción fue anulada. Si crees que es un error, escríbenos a eventos@shark.caribe.co.',
  },
  ERROR: {
    title: 'Hubo un error en el pago',
    body: 'No pudimos confirmar la transacción. Intenta de nuevo desde Entradas o contáctanos.',
  },
  PENDING: {
    title: 'Pago en proceso',
    body: 'Estamos esperando la confirmación de Wompi. En unos minutos tu entrada debería quedar en estado pagado.',
  },
}

export default function PaymentResult() {
  const [params] = useSearchParams()
  const transactionId = params.get('id') || ''
  const [loading, setLoading] = useState(Boolean(transactionId))
  const [status, setStatus] = useState(transactionId ? 'PENDING' : '')
  const [reference, setReference] = useState('')
  const [fetchError, setFetchError] = useState('')

  const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY
  const configured = isWompiConfigured()

  useEffect(() => {
    if (!transactionId || !configured) {
      setLoading(false)
      return
    }

    let cancelled = false
    const base = wompiApiBase(publicKey)

    async function load() {
      try {
        const res = await fetch(`${base}/transactions/${encodeURIComponent(transactionId)}`, {
          headers: { Authorization: `Bearer ${publicKey}` },
        })
        if (!res.ok) {
          throw new Error('No se pudo consultar la transacción.')
        }
        const json = await res.json()
        const tx = json?.data
        if (!cancelled && tx) {
          setStatus(tx.status || 'PENDING')
          setReference(tx.reference || '')
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err.message || 'No se pudo consultar el estado.')
          setStatus('PENDING')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [transactionId, configured, publicKey])

  const copy = useMemo(() => {
    if (!transactionId) {
      return {
        title: 'Resultado del pago',
        body: 'No encontramos el identificador de la transacción. Si ya pagaste, tu entrada se confirmará automáticamente en breve.',
      }
    }
    return STATUS_COPY[status] || STATUS_COPY.PENDING
  }, [status, transactionId])

  return (
    <main className="payment-result">
      <div className="payment-result__card">
        <p className="payment-result__eyebrow">Shark Caribe 2026</p>
        {loading ? (
          <>
            <h1>Confirmando tu pago…</h1>
            <p>Un momento mientras consultamos el estado en Wompi.</p>
          </>
        ) : (
          <>
            <h1>{copy.title}</h1>
            <p>{copy.body}</p>
            {fetchError && (
              <p className="payment-result__hint" role="status">
                {fetchError} Si el pago fue aprobado, igual quedará confirmado por nuestro sistema.
              </p>
            )}
            {(transactionId || reference) && (
              <dl className="payment-result__meta">
                {transactionId && (
                  <>
                    <dt>Transacción</dt>
                    <dd>
                      <code>{transactionId}</code>
                    </dd>
                  </>
                )}
                {reference && (
                  <>
                    <dt>Referencia</dt>
                    <dd>
                      <code>{reference}</code>
                    </dd>
                  </>
                )}
              </dl>
            )}
          </>
        )}
        <div className="payment-result__actions">
          <Link className="btn btn--primary" to="/#entradas">
            Volver a entradas
          </Link>
          <Link className="btn btn--outline" to="/">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
