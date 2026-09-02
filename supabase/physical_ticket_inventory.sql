-- ============================================================
-- Inventario físico · Opción A
-- 100 Preferencial + 100 General (status = pago, con número y QR)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================
-- Requisitos previos (ya deben estar en producción):
--   · attendee_ticket_number.sql
--   · attendee_checkin.sql  (ticket_token + check-in)
--
-- Qué hace:
--   · Crea 200 filas en attendee_registrations
--   · status = 'pago' → el trigger asigna ticket_number
--   · ticket_token UUID único → QR de acceso
--   · Marcadas con payment_confirmation = 'FISICO:INVENTARIO'
--   · document_number: FIS-PREF-001…100 / FIS-GEN-001…100
--
-- Idempotente: si ya existen esos documentos, no duplica.
--
-- IMPORTANTE:
--   · Guardar las boletas impresas como dinero (el QR funciona).
--   · Controlar cupo vs venta online (no hay tope automático).
--   · Al vender, ideal actualizar full_name / email / document_number
--     del comprador real (manteniendo el mismo id / ticket_token).
-- ============================================================

-- 0) Vista previa: ¿cuántas físicas hay ya?
SELECT
  seat_type,
  count(*) AS existentes
FROM public.attendee_registrations
WHERE payment_confirmation = 'FISICO:INVENTARIO'
   OR document_number LIKE 'FIS-PREF-%'
   OR document_number LIKE 'FIS-GEN-%'
GROUP BY seat_type
ORDER BY seat_type;

-- ------------------------------------------------------------
-- 1) 100 Preferencial
-- ------------------------------------------------------------
INSERT INTO public.attendee_registrations (
  full_name,
  document_type,
  document_number,
  email,
  phone,
  profile,
  organization,
  interest,
  seat_type,
  referral_source,
  referral_source_other,
  status,
  amount_in_cents,
  payment_reference,
  payment_confirmation,
  reviewed_at,
  ticket_token
)
SELECT
  'Boleta física Preferencial #' || lpad(g.n::text, 3, '0'),
  'CC'::public.attendee_document_type,
  'FIS-PREF-' || lpad(g.n::text, 3, '0'),
  lower('fisico.pref.' || lpad(g.n::text, 3, '0') || '@boleta.fisica.local'),
  '3000000' || lpad(g.n::text, 3, '0'),
  'publico_general'::public.attendee_profile,
  'Inventario físico',
  'networking'::public.attendee_interest,
  'preferencial'::public.attendee_seat_type,
  'other'::public.attendee_referral_source,
  'Inventario boleta física',
  'pago',
  7990000,
  'FIS-PREF-' || lpad(g.n::text, 3, '0') || '-' || to_char(now(), 'YYYYMMDD'),
  'FISICO:INVENTARIO',
  now(),
  gen_random_uuid()
FROM generate_series(1, 100) AS g(n)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.attendee_registrations a
  WHERE a.document_number = 'FIS-PREF-' || lpad(g.n::text, 3, '0')
);

-- ------------------------------------------------------------
-- 2) 100 General
-- ------------------------------------------------------------
INSERT INTO public.attendee_registrations (
  full_name,
  document_type,
  document_number,
  email,
  phone,
  profile,
  organization,
  interest,
  seat_type,
  referral_source,
  referral_source_other,
  status,
  amount_in_cents,
  payment_reference,
  payment_confirmation,
  reviewed_at,
  ticket_token
)
SELECT
  'Boleta física General #' || lpad(g.n::text, 3, '0'),
  'CC'::public.attendee_document_type,
  'FIS-GEN-' || lpad(g.n::text, 3, '0'),
  lower('fisico.gen.' || lpad(g.n::text, 3, '0') || '@boleta.fisica.local'),
  '3010000' || lpad(g.n::text, 3, '0'),
  'publico_general'::public.attendee_profile,
  'Inventario físico',
  'networking'::public.attendee_interest,
  'general'::public.attendee_seat_type,
  'other'::public.attendee_referral_source,
  'Inventario boleta física',
  'pago',
  5000000,
  'FIS-GEN-' || lpad(g.n::text, 3, '0') || '-' || to_char(now(), 'YYYYMMDD'),
  'FISICO:INVENTARIO',
  now(),
  gen_random_uuid()
FROM generate_series(1, 100) AS g(n)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.attendee_registrations a
  WHERE a.document_number = 'FIS-GEN-' || lpad(g.n::text, 3, '0')
);

-- ------------------------------------------------------------
-- 3) Verificación
-- ------------------------------------------------------------
SELECT
  seat_type,
  count(*) AS total,
  count(*) FILTER (WHERE status = 'pago') AS pagados,
  count(*) FILTER (WHERE ticket_number IS NOT NULL) AS con_numero,
  count(*) FILTER (WHERE ticket_token IS NOT NULL) AS con_token,
  min(ticket_number) AS ticket_min,
  max(ticket_number) AS ticket_max
FROM public.attendee_registrations
WHERE payment_confirmation = 'FISICO:INVENTARIO'
GROUP BY seat_type
ORDER BY seat_type;

-- Listado para imprimir / control de caja (export CSV desde el result grid)
SELECT
  ticket_number,
  seat_type,
  document_number,
  full_name,
  ticket_token,
  amount_in_cents,
  status,
  checked_in_at,
  id
FROM public.attendee_registrations
WHERE payment_confirmation = 'FISICO:INVENTARIO'
ORDER BY seat_type, ticket_number NULLS LAST, document_number;

-- ------------------------------------------------------------
-- 4) (Opcional) Borrar SOLO este inventario si te equivocaste
--    Descomenta y ejecuta con cuidado.
-- ------------------------------------------------------------
-- DELETE FROM public.attendee_registrations
-- WHERE payment_confirmation = 'FISICO:INVENTARIO'
--   AND checked_in_at IS NULL
--   AND (
--     document_number LIKE 'FIS-PREF-%'
--     OR document_number LIKE 'FIS-GEN-%'
--   );
