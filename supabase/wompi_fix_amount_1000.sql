-- ============================================================
-- FIX Wompi RPC (sin birth_date) + monto de PRUEBA $1.000 COP
-- Ejecutar en SQL Editor. Cuando termines la prueba, vuelve a
-- correr supabase/wompi_checkout_rpc.sql (montos normales).
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_attendee_wompi_checkout(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  v_seat text := nullif(trim(payload->>'seatType'), '');
  v_amount integer;
  v_full_name text := nullif(trim(payload->>'fullName'), '');
  v_document_type text := nullif(trim(payload->>'documentType'), '');
  v_document_number text := nullif(trim(payload->>'documentNumber'), '');
  v_email text := lower(nullif(trim(payload->>'email'), ''));
  v_phone text := nullif(trim(payload->>'phone'), '');
  v_profile text := nullif(trim(payload->>'profile'), '');
  v_organization text := nullif(trim(payload->>'organization'), '');
  v_interest text := nullif(trim(payload->>'interest'), '');
  v_accompanied uuid := nullif(trim(payload->>'accompaniedCompetitorId'), '')::uuid;
  v_referral text := nullif(trim(payload->>'referralSource'), '');
  v_referral_other text := nullif(trim(payload->>'referralSourceOther'), '');
  v_reference text;
  v_integrity text;
  v_signature text;
  v_id uuid;
  v_legal_id_type text;
BEGIN
  -- PRUEBA: $1.000 COP = 100000 centavos
  IF v_seat IN ('preferencial', 'general') THEN
    v_amount := 100000;
  ELSE
    RAISE EXCEPTION 'Selecciona Preferencial o General.' USING ERRCODE = '22023';
  END IF;

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

  SELECT s.value INTO v_integrity
  FROM private.wompi_secrets s
  WHERE s.key = 'integrity_secret';

  IF v_integrity IS NULL OR v_integrity LIKE 'PEGAR_AQUI%' THEN
    RAISE EXCEPTION
      'Falta configurar private.wompi_secrets.integrity_secret en la base de datos.'
      USING ERRCODE = 'P0001';
  END IF;

  v_reference :=
    'SC26-' ||
    upper(to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint)) ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  v_signature := encode(
    digest(
      convert_to(v_reference || v_amount::text || 'COP' || v_integrity, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

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
    accompanied_competitor_id,
    referral_source,
    referral_source_other,
    status,
    payment_reference,
    amount_in_cents
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
    v_amount
  )
  RETURNING id INTO v_id;

  v_legal_id_type := CASE v_document_type
    WHEN 'passport' THEN 'PP'
    ELSE v_document_type
  END;

  RETURN jsonb_build_object(
    'registrationId', v_id,
    'currency', 'COP',
    'amountInCents', v_amount,
    'reference', v_reference,
    'signatureIntegrity', v_signature,
    'customerData', jsonb_build_object(
      'email', v_email,
      'fullName', v_full_name,
      'phoneNumber', regexp_replace(v_phone, '\D', '', 'g'),
      'phoneNumberPrefix', '+57',
      'legalId', v_document_number,
      'legalIdType', v_legal_id_type
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION
      'Ya existe un registro con ese correo o documento. Si ya te inscribiste, revisa tu correo o escríbenos.'
      USING ERRCODE = '23505';
END;
$$;

REVOKE ALL ON FUNCTION public.create_attendee_wompi_checkout(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_attendee_wompi_checkout(jsonb) TO anon, authenticated;
