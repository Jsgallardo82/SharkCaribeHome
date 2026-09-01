-- ============================================================
-- Prueba de correo ticket (Resend) — ejecutar en 3 pasos
-- ============================================================
-- Edita SOLO la sección CONFIG de cada paso.
-- Project URL: https://TU_REF.supabase.co  (SIN /rest/v1/)
-- service_role: Legacy API key (eyJ...)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ############################################################
-- PASO 1 — crea/actualiza asistentes de prueba
-- Selecciona solo desde aquí hasta el SELECT final del paso 1
-- y dale Run.
-- ############################################################

-- CONFIG (cámbialos):
-- preferencial → tu Gmail
-- general → tu otro correo

INSERT INTO public.attendee_registrations (
  full_name, document_type, document_number, email, phone,
  profile, organization, interest, seat_type, referral_source,
  status, amount_in_cents, payment_reference, payment_confirmation, reviewed_at
) VALUES (
  'Prueba Preferencial',
  'CC',
  'TEST-TICKET-PREF',
  lower('juansebastiangallardobaena@gmail.com'),  -- ← correo pref
  '3000000001',
  'publico_general',
  'Shark Caribe Test',
  'networking',
  'preferencial',
  'recomendacion',
  'pago',
  7990000,
  'TEST-PREF-' || to_char(now(), 'YYYYMMDDHH24MISS'),
  'TEST:RESEND',
  now()
)
ON CONFLICT (document_number) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  seat_type = 'preferencial',
  status = 'pago',
  amount_in_cents = 7990000,
  payment_confirmation = 'TEST:RESEND',
  reviewed_at = now(),
  updated_at = now();

INSERT INTO public.attendee_registrations (
  full_name, document_type, document_number, email, phone,
  profile, organization, interest, seat_type, referral_source,
  status, amount_in_cents, payment_reference, payment_confirmation, reviewed_at
) VALUES (
  'Prueba General',
  'CC',
  'TEST-TICKET-GEN',
  lower('juan.gallardo@codigoabierto.tech'),  -- ← correo gen
  '3000000002',
  'publico_general',
  'Shark Caribe Test',
  'networking',
  'general',
  'recomendacion',
  'pago',
  5000000,
  'TEST-GEN-' || to_char(now(), 'YYYYMMDDHH24MISS'),
  'TEST:RESEND',
  now()
)
ON CONFLICT (document_number) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  seat_type = 'general',
  status = 'pago',
  amount_in_cents = 5000000,
  payment_confirmation = 'TEST:RESEND',
  reviewed_at = now(),
  updated_at = now();

UPDATE public.attendee_registrations
SET ticket_token = coalesce(ticket_token, gen_random_uuid())
WHERE document_number IN ('TEST-TICKET-PREF', 'TEST-TICKET-GEN');

SELECT id, full_name, email, seat_type, status, ticket_number, ticket_token
FROM public.attendee_registrations
WHERE document_number IN ('TEST-TICKET-PREF', 'TEST-TICKET-GEN')
ORDER BY seat_type;

-- ############################################################
-- PASO 2 — envía los correos (solo este bloque, Run)
-- Pega tu service_role eyJ... en los DOS sitios (Bearer y apikey)
-- ############################################################

SELECT net.http_post(
  url := 'https://jcrjvtpylprlcvojxuvw.supabase.co/functions/v1/resend-ticket',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || 'PEGAR_SERVICE_ROLE_AQUI',
    'apikey', 'PEGAR_SERVICE_ROLE_AQUI'
  ),
  body := jsonb_build_object(
    'attendeeId',
    (SELECT id FROM public.attendee_registrations WHERE document_number = 'TEST-TICKET-PREF')
  )
) AS request_id_preferencial;

SELECT net.http_post(
  url := 'https://jcrjvtpylprlcvojxuvw.supabase.co/functions/v1/resend-ticket',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || 'PEGAR_SERVICE_ROLE_AQUI',
    'apikey', 'PEGAR_SERVICE_ROLE_AQUI'
  ),
  body := jsonb_build_object(
    'attendeeId',
    (SELECT id FROM public.attendee_registrations WHERE document_number = 'TEST-TICKET-GEN')
  )
) AS request_id_general;

-- ############################################################
-- PASO 3 — espera 3–5 segundos y corre solo esto
-- ############################################################

SELECT
  id,
  status_code,
  content::text AS body,
  created
FROM net._http_response
ORDER BY created DESC
LIMIT 5;

-- Esperado: status_code 200 y body con "ok": true

-- Limpieza opcional:
-- DELETE FROM public.attendee_registrations
-- WHERE document_number IN ('TEST-TICKET-PREF', 'TEST-TICKET-GEN');
