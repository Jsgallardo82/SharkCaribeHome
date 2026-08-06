-- ============================================================
-- Shark Caribe 2026 · Campos Wompi para entradas (asistentes)
-- Ejecutar en el SQL Editor de Supabase (manual).
-- ============================================================

ALTER TABLE public.attendee_registrations
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS amount_in_cents integer,
  ADD COLUMN IF NOT EXISTS wompi_transaction_id text;

-- Referencia única por cobro (Wompi no permite reutilizar referencias)
CREATE UNIQUE INDEX IF NOT EXISTS attendee_registrations_payment_reference_uidx
  ON public.attendee_registrations (payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS attendee_registrations_wompi_tx_idx
  ON public.attendee_registrations (wompi_transaction_id)
  WHERE wompi_transaction_id IS NOT NULL;

COMMENT ON COLUMN public.attendee_registrations.payment_reference IS
  'Referencia única enviada a Wompi Checkout';
COMMENT ON COLUMN public.attendee_registrations.amount_in_cents IS
  'Monto cobrado en centavos COP (ej. 7990000 = $79.900)';
COMMENT ON COLUMN public.attendee_registrations.wompi_transaction_id IS
  'ID de transacción Wompi cuando el webhook confirma el pago';
