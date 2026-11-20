-- ============================================================
-- Prueba de boleta obsequio → jsgallardo@est.uniatlantico.edu.co
-- SQL Editor de Supabase. Corre cada paso por separado.
-- El correo que pasaste no traía dominio final; el institucional
-- de Uniatlántico es @est.uniatlantico.edu.co. Cámbialo si no es ese.
-- Silla de esta prueba: preferencial. Monto vacío (no se imprime precio).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ############################################################
-- PASO 1 — crea el asistente (Run solo esto)
-- Copia el id que devuelve el SELECT.
-- ############################################################

INSERT INTO public.attendee_registrations (
  full_name, document_type, document_number, email, phone,
  profile, interest, seat_type, referral_source,
  status, amount_in_cents, payment_reference, payment_confirmation, reviewed_at,
  ticket_token
) VALUES (
  'Prueba JS Gallardo',
  'CC',
  'OBSEQUIO-JSG',
  'jsgallardo@est.uniatlantico.edu.co',
  '3000000000',
  'publico_general',
  'networking',
  'preferencial',
  'recomendacion',
  'pago',
  NULL,
  'OBSEQUIO-JSG',
  'OBSEQUIO',
  now(),
  gen_random_uuid()
);

SELECT id, full_name, email, seat_type, status, ticket_number, ticket_token
FROM public.attendee_registrations
WHERE document_number = 'OBSEQUIO-JSG';

-- ############################################################
-- PASO 2 — envía el correo (Run solo esto)
-- Pega el service_role (eyJ...) en LOS DOS sitios.
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
    (SELECT id FROM public.attendee_registrations WHERE document_number = 'OBSEQUIO-JSG')
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
