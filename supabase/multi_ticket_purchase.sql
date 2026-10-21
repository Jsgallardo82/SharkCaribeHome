-- ============================================================
--  Shark Caribe 2026 · Compra de varias boletas en un solo pago
--  Ejecutar en Supabase → SQL Editor
--
--  ⚠️ ORDEN: primero la Edge Function wompi-webhook, DESPUÉS este SQL.
--     Al revés, una compra múltiple se cobra y no se puede confirmar.
--
--  NO toca create_event_wompi_checkout. La ruta de pago de
--  patrocinadores y expositores queda exactamente como está.
--  Los asistentes pasan a usar una función nueva: create_ticket_purchase.
-- ============================================================


-- ------------------------------------------------------------
-- 0. Fila de prueba creada por accidente durante el desarrollo.
--    Descomenta el SELECT si quieres verla antes de borrarla.
-- ------------------------------------------------------------
-- SELECT id, full_name, email, status, created_at
--   FROM public.attendee_registrations
--  WHERE email = 'juan@example.com' AND status = 'pending';

DELETE FROM public.attendee_registrations
 WHERE email = 'juan@example.com'
   AND document_number = '1045678901'
   AND status = 'pending';


-- ------------------------------------------------------------
-- 1. Fuera los UNIQUE de email y documento
--
--    Bloqueaban dos cosas a la vez:
--      · comprar más de una boleta con los mismos datos
--      · reintentar tras un pago rechazado — la fila 'pending' del
--        intento fallido dejaba al comprador fuera para siempre
--
--    Lo que evita cobros duplicados no es este índice, sino que cada
--    compra genera su propia referencia Wompi.
-- ------------------------------------------------------------
ALTER TABLE public.attendee_registrations
  DROP CONSTRAINT IF EXISTS attendee_registrations_email_unique,
  DROP CONSTRAINT IF EXISTS attendee_registrations_document_unique;


-- ------------------------------------------------------------
-- 2. La referencia de pago la comparten las N boletas de una compra,
--    así que deja de ser única por fila.
-- ------------------------------------------------------------
DROP INDEX IF EXISTS public.attendee_registrations_payment_reference_uidx;

CREATE INDEX IF NOT EXISTS attendee_registrations_payment_reference_idx
  ON public.attendee_registrations (payment_reference)
  WHERE payment_reference IS NOT NULL;


-- ------------------------------------------------------------
-- 3. Boletas de acompañante: solo nombre, sin documento
-- ------------------------------------------------------------
ALTER TABLE public.attendee_registrations
  ALTER COLUMN document_type DROP NOT NULL,
  ALTER COLUMN document_number DROP NOT NULL;

COMMENT ON COLUMN public.attendee_registrations.document_number IS
  'Documento del titular. NULL en boletas de acompañante (el acceso es el QR).';


-- ------------------------------------------------------------
-- 4. Agrupación por compra
-- ------------------------------------------------------------
ALTER TABLE public.attendee_registrations
  ADD COLUMN IF NOT EXISTS purchase_group_id uuid,
  ADD COLUMN IF NOT EXISTS purchase_index smallint;

CREATE INDEX IF NOT EXISTS attendee_registrations_purchase_group_idx
  ON public.attendee_registrations (purchase_group_id)
  WHERE purchase_group_id IS NOT NULL;

COMMENT ON COLUMN public.attendee_registrations.purchase_group_id IS
  'Agrupa las boletas compradas en una misma transacción. NULL = compra anterior a este cambio.';
COMMENT ON COLUMN public.attendee_registrations.purchase_index IS
  '1 = comprador; 2..n = acompañantes de esa misma compra.';


-- ------------------------------------------------------------
-- 5. Función nueva: compra de 1..10 boletas de asistente
--
--    Montos:
--      · amount_in_cents guarda el precio UNITARIO de cada boleta
--        (es lo que aparece en el correo de cada ticket)
--      · a Wompi se le firma el TOTAL
--      · el webhook compara el cobro contra la SUMA del grupo
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_ticket_purchase(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  v_integrity text;
  v_reference text;
  v_signature text;
  v_group_id uuid;
  v_id uuid;

  v_seat text;
  v_full_name text;
  v_document_type text;
  v_document_number text;
  v_email text;
  v_phone text;
  v_profile text;
  v_organization text;
  v_interest text;
  v_accompanied uuid;
  v_referral text;
  v_referral_other text;

  v_quantity int;
  v_unit_amount bigint;
  v_total_amount bigint;
  v_companions jsonb;
  v_companion jsonb;
  v_index smallint;
  v_c_name text;
  v_c_email text;
BEGIN
  SELECT s.value INTO v_integrity
  FROM private.wompi_secrets s
  WHERE s.key = 'integrity_secret';

  IF v_integrity IS NULL OR v_integrity LIKE 'PEGAR_AQUI%' THEN
    RAISE EXCEPTION
      'Falta configurar private.wompi_secrets.integrity_secret en la base de datos.'
      USING ERRCODE = 'P0001';
  END IF;

  v_seat := nullif(trim(payload->>'seatType'), '');
  v_full_name := nullif(trim(payload->>'fullName'), '');
  v_document_type := nullif(trim(payload->>'documentType'), '');
  v_document_number := nullif(trim(payload->>'documentNumber'), '');
  v_email := lower(nullif(trim(payload->>'email'), ''));
  v_phone := nullif(trim(payload->>'phone'), '');
  v_profile := nullif(trim(payload->>'profile'), '');
  v_organization := nullif(trim(payload->>'organization'), '');
  v_interest := nullif(trim(payload->>'interest'), '');
  v_accompanied := nullif(trim(payload->>'accompaniedCompetitorId'), '')::uuid;
  v_referral := nullif(trim(payload->>'referralSource'), '');
  v_referral_other := nullif(trim(payload->>'referralSourceOther'), '');

  -- La cantidad es el único dato del cliente que multiplica el precio.
  -- Se acota aquí; nunca confiar en el <select> del navegador.
  v_quantity := coalesce(nullif(trim(payload->>'quantity'), '')::int, 1);
  IF v_quantity < 1 OR v_quantity > 10 THEN
    RAISE EXCEPTION 'Puedes comprar entre 1 y 10 boletas por transacción.'
      USING ERRCODE = '22023';
  END IF;

  v_companions := coalesce(payload->'companions', '[]'::jsonb);
  IF jsonb_typeof(v_companions) <> 'array' THEN
    RAISE EXCEPTION 'Datos de acompañantes inválidos.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(v_companions) <> v_quantity - 1 THEN
    RAISE EXCEPTION
      'Faltan datos: se esperaban % boletas adicionales y llegaron %.',
      v_quantity - 1, jsonb_array_length(v_companions)
      USING ERRCODE = '22023';
  END IF;

  IF v_seat = 'preferencial' THEN
    v_unit_amount := 7990000; -- $79.900
  ELSIF v_seat = 'general' THEN
    v_unit_amount := 5000000; -- $50.000
  ELSE
    RAISE EXCEPTION 'Selecciona Preferencial o General.' USING ERRCODE = '22023';
  END IF;

  v_total_amount := v_unit_amount * v_quantity;

  IF v_full_name IS NULL OR length(v_full_name) < 3 THEN
    RAISE EXCEPTION 'Escribe tu nombre completo.' USING ERRCODE = '22023';
  END IF;
  IF v_document_type IS NULL OR v_document_type NOT IN ('TI', 'CC', 'CE', 'passport') THEN
    RAISE EXCEPTION 'Tipo de documento inválido.' USING ERRCODE = '22023';
  END IF;
  IF v_document_number IS NULL OR length(v_document_number) < 5 THEN
    RAISE EXCEPTION 'Número de documento inválido.' USING ERRCODE = '22023';
  END IF;
  IF v_email IS NULL OR v_email !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'Correo electrónico inválido.' USING ERRCODE = '22023';
  END IF;
  IF v_phone IS NULL OR length(regexp_replace(v_phone, '\D', '', 'g')) < 7 THEN
    RAISE EXCEPTION 'Celular inválido.' USING ERRCODE = '22023';
  END IF;
  IF v_profile IS NULL OR v_interest IS NULL OR v_referral IS NULL THEN
    RAISE EXCEPTION 'Completa todos los campos obligatorios.' USING ERRCODE = '22023';
  END IF;
  IF v_referral = 'other' AND (v_referral_other IS NULL OR length(v_referral_other) = 0) THEN
    RAISE EXCEPTION 'Especifica por qué medio te enteraste.' USING ERRCODE = '22023';
  END IF;
  IF v_referral <> 'other' THEN
    v_referral_other := NULL;
  END IF;

  v_reference :=
    'SC26-ASI-' ||
    upper(to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint)) ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- La firma va sobre el TOTAL, que es lo que Wompi cobra
  v_signature := encode(
    digest(
      convert_to(v_reference || v_total_amount::text || 'COP' || v_integrity, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  v_group_id := gen_random_uuid();

  -- Boleta 1: el comprador, con datos completos
  INSERT INTO public.attendee_registrations (
    full_name, document_type, document_number, email, phone,
    profile, organization, interest, seat_type, accompanied_competitor_id,
    referral_source, referral_source_other, status,
    payment_reference, amount_in_cents, purchase_group_id, purchase_index
  )
  VALUES (
    v_full_name,
    v_document_type::public.attendee_document_type,
    v_document_number,
    v_email,
    v_phone,
    v_profile::public.attendee_profile,
    v_organization,
    v_interest::public.attendee_interest,
    v_seat::public.attendee_seat_type,
    v_accompanied,
    v_referral::public.attendee_referral_source,
    v_referral_other,
    'pending',
    v_reference,
    v_unit_amount,
    v_group_id,
    1
  )
  RETURNING id INTO v_id;

  -- Boletas 2..n: acompañantes. Sin documento; si no dieron correo,
  -- cae al del comprador para que el QR siempre llegue a alguien.
  v_index := 1;
  FOR v_companion IN SELECT value FROM jsonb_array_elements(v_companions)
  LOOP
    v_index := v_index + 1;
    v_c_name := nullif(trim(v_companion->>'fullName'), '');
    v_c_email := lower(nullif(trim(v_companion->>'email'), ''));

    IF v_c_name IS NULL OR length(v_c_name) < 3 THEN
      RAISE EXCEPTION 'Escribe el nombre completo de la boleta %.', v_index
        USING ERRCODE = '22023';
    END IF;
    IF v_c_email IS NOT NULL AND v_c_email !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
      RAISE EXCEPTION 'El correo de la boleta % no es válido.', v_index
        USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.attendee_registrations (
      full_name, document_type, document_number, email, phone,
      profile, organization, interest, seat_type, accompanied_competitor_id,
      referral_source, referral_source_other, status,
      payment_reference, amount_in_cents, purchase_group_id, purchase_index
    )
    VALUES (
      v_c_name,
      NULL,
      NULL,
      coalesce(v_c_email, v_email),
      v_phone,
      v_profile::public.attendee_profile,
      v_organization,
      v_interest::public.attendee_interest,
      v_seat::public.attendee_seat_type,
      v_accompanied,
      v_referral::public.attendee_referral_source,
      v_referral_other,
      'pending',
      v_reference,
      v_unit_amount,
      v_group_id,
      v_index
    );
  END LOOP;

  RETURN jsonb_build_object(
    'registrationId', v_id,
    'kind', 'asistente',
    'currency', 'COP',
    'amountInCents', v_total_amount,
    'unitAmountInCents', v_unit_amount,
    'quantity', v_quantity,
    'purchaseGroupId', v_group_id,
    'reference', v_reference,
    'signatureIntegrity', v_signature,
    'customerData', jsonb_build_object(
      'email', v_email,
      'fullName', v_full_name,
      'phoneNumber', regexp_replace(v_phone, '\D', '', 'g'),
      'phoneNumberPrefix', '+57',
      'legalId', v_document_number,
      'legalIdType', CASE v_document_type WHEN 'passport' THEN 'PP' ELSE v_document_type END
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_ticket_purchase(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_ticket_purchase(jsonb) TO anon, authenticated;

COMMENT ON FUNCTION public.create_ticket_purchase(jsonb) IS
  'Compra de 1..10 boletas de asistente en un solo pago Wompi. Una fila (y un QR) por boleta, agrupadas por purchase_group_id.';


-- ============================================================
--  PRUEBA SIN TOCAR WOMPI NI DEJAR BASURA
--
--  Selecciona el bloque completo y ejecútalo. El ROLLBACK del final
--  deshace todo: no queda ninguna fila y no se cobra nada.
--  Wompi está en PRODUCCIÓN, así que esta es la forma segura de
--  verificar la lógica antes de probar una compra real.
-- ============================================================
/*
BEGIN;

SELECT public.create_ticket_purchase(jsonb_build_object(
  'seatType',       'general',
  'fullName',       'Prueba Tres Boletas',
  'documentType',   'CC',
  'documentNumber', '999999999',
  'email',          'prueba-rollback@sharkcaribe.co',
  'phone',          '3001112233',
  'profile',        'emprendedor',
  'interest',       'networking',
  'referralSource', 'instagram',
  'quantity',       3,
  'companions',     jsonb_build_array(
                      jsonb_build_object('fullName', 'Acompanante Uno', 'email', 'uno@example.com'),
                      jsonb_build_object('fullName', 'Acompanante Dos', 'email', NULL)
                    )
)) AS checkout;

-- Debe devolver 3 filas: índices 1,2,3 · misma referencia y mismo grupo
-- · 3 × 5000000 = 15000000 centavos ($150.000)
SELECT purchase_index, full_name, email, document_number,
       amount_in_cents, payment_reference, purchase_group_id
  FROM public.attendee_registrations
 WHERE payment_reference LIKE 'SC26-ASI-%'
   AND email IN ('prueba-rollback@sharkcaribe.co', 'uno@example.com')
 ORDER BY purchase_index;

ROLLBACK;
*/

-- Casos que DEBEN fallar (pruébalos igual entre BEGIN/ROLLBACK):
--   quantity = 11            → 'Puedes comprar entre 1 y 10 boletas'
--   quantity = 3 con 1 companion → 'se esperaban 2 boletas adicionales y llegaron 1'
--   companion sin fullName   → 'Escribe el nombre completo de la boleta 2'


-- ------------------------------------------------------------
--  Consulta útil para el día a día: compras agrupadas
-- ------------------------------------------------------------
-- SELECT purchase_group_id, payment_reference, count(*) AS boletas,
--        sum(amount_in_cents) AS total_centavos,
--        min(status) AS estado, max(created_at) AS creada
--   FROM public.attendee_registrations
--  WHERE purchase_group_id IS NOT NULL
--  GROUP BY purchase_group_id, payment_reference
--  ORDER BY creada DESC
--  LIMIT 10;
