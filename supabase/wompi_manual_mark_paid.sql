-- ============================================================
-- Reparar pago Wompi (manual) + checklist de webhook
-- ============================================================
-- Cuándo usarlo: el checkout creó la fila (payment_reference +
-- amount_in_cents) pero status / payment_confirmation /
-- wompi_transaction_id quedaron vacíos porque el webhook no corrió.
--
-- 1) Localiza la fila:
--    SELECT id, email, payment_reference, amount_in_cents, status,
--           payment_confirmation, wompi_transaction_id, created_at
--    FROM public.attendee_registrations
--    ORDER BY created_at DESC LIMIT 10;
--    (o sponsor_registrations / exhibitor_registrations)
--
-- 2) Copia payment_reference y descomenta SOLO el UPDATE de esa tabla.
--    Sustituye PEGAR_REFERENCE. Si tienes el id de tx Wompi, úsalo;
--    si no, deja MANUAL.
-- ============================================================

-- Normalizar filas con status NULL/vacío → pending (seguro)
UPDATE public.attendee_registrations
SET status = 'pending'
WHERE status IS NULL OR btrim(status) = '';

UPDATE public.sponsor_registrations
SET status = 'pending'
WHERE status IS NULL OR btrim(status) = '';

UPDATE public.exhibitor_registrations
SET status = 'pending'
WHERE status IS NULL OR btrim(status) = '';

-- --- ASISTENTE (descomenta y edita) ---
-- Al pasar a 'pago', el trigger asigna ticket_number automáticamente
-- (requiere haber ejecutado attendee_ticket_number.sql).
-- UPDATE public.attendee_registrations
-- SET
--   status = 'pago',
--   payment_confirmation = 'WOMPI:MANUAL',
--   -- wompi_transaction_id = 'id-de-transaccion-wompi',
--   reviewed_at = now()
-- WHERE payment_reference = 'PEGAR_REFERENCE'
--   AND coalesce(status, '') IS DISTINCT FROM 'pago';
-- Luego: SELECT id, email, ticket_number, status FROM attendee_registrations
--        WHERE payment_reference = 'PEGAR_REFERENCE';

-- --- PATROCINADOR (descomenta y edita) ---
-- UPDATE public.sponsor_registrations
-- SET
--   status = 'pago',
--   payment_confirmation = 'WOMPI:MANUAL',
--   reviewed_at = now()
-- WHERE payment_reference = 'PEGAR_REFERENCE'
--   AND coalesce(status, '') IS DISTINCT FROM 'pago';

-- --- EXPOSITOR (descomenta y edita) ---
-- UPDATE public.exhibitor_registrations
-- SET
--   status = 'pago',
--   payment_confirmation = 'WOMPI:MANUAL',
--   reviewed_at = now()
-- WHERE payment_reference = 'PEGAR_REFERENCE'
--   AND coalesce(status, '') IS DISTINCT FROM 'pago';

-- ============================================================
-- CHECKLIST (después del fix de código)
-- ============================================================
-- [ ] Redeploy:
--     supabase functions deploy wompi-webhook
--
-- [ ] Edge secret WOMPI_EVENTS_SECRET = Events secret de Wompi
--     (mismo ambiente: prod o sandbox)
--
-- [ ] Wompi → Eventos → URL:
--     https://jcrjvtpylprlcvojxuvw.supabase.co/functions/v1/wompi-webhook
--
-- [ ] Logs de wompi-webhook al pagar: "marcado como pago"
--     (no: checksum inválido / unknownReference / amountMismatch /
--      UPDATE 0 filas)
--
-- [ ] integrity_secret (checkout) ≠ WOMPI_EVENTS_SECRET (eventos)
-- ============================================================
