-- ============================================================
-- Prueba rápida: enviar ticket a juan.gallardo@codigoabierto.tech
-- Ejecutar en Supabase → SQL Editor (3 pasos separados)
-- ============================================================
-- Requiere: Edge Function resend-ticket redesplegada
--            RESEND_API_KEY + RESEND_FROM configurados
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ############################################################
-- PASO 1 — crea/actualiza asistente de prueba (Run solo esto)
-- ############################################################

INSERT INTO public.attendee_registrations (
  full_name, document_type, document_number, email, phone,
  profile, organization, interest, seat_type, referral_source,
  status, amount_in_cents, payment_reference, payment_confirmation, reviewed_at
) VALUES (
  'Prueba Juan Gallardo',
  'CC',
  'TEST-TICKET-JG',
  lower('juan.gallardo@codigoabierto.tech'),
  '3001234567',
  'publico_general',
  'Shark Caribe Test',
  'networking',
  'preferencial',
  'recomendacion',
  'pago',
  7990000,
  'TEST-JG-' || to_char(now(), 'YYYYMMDDHH24MISS'),
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

UPDATE public.attendee_registrations
SET ticket_token = coalesce(ticket_token, gen_random_uuid())
WHERE document_number = 'TEST-TICKET-JG';

SELECT id, full_name, email, seat_type, status, ticket_number, ticket_token
FROM public.attendee_registrations
WHERE document_number = 'TEST-TICKET-JG';

-- ############################################################
-- PASO 2 — envía el correo (Run solo esto)
-- Pega tu service_role (eyJ...) en LOS DOS sitios
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
    (SELECT id FROM public.attendee_registrations WHERE document_number = 'TEST-TICKET-JG')
  )
) AS request_id;

-- ############################################################
-- PASO 3 — espera 3–5 s y corre solo esto
-- Esperado: status_code 200 y body con "ok": true
-- ############################################################

SELECT
  id,
  status_code,
  content::text AS body,
  created
FROM net._http_response
ORDER BY created DESC
LIMIT 3;

-- Limpieza opcional:
-- DELETE FROM public.attendee_registrations WHERE document_number = 'TEST-TICKET-JG';
