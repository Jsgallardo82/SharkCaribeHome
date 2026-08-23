-- ============================================================
-- Shark Caribe 2026 · Checkout Wompi unificado
-- Asistentes + Patrocinadores + Expositores
-- Ejecutar en SQL Editor de Supabase.
-- ============================================================

-- Columnas Wompi en patrocinadores
-- amount_in_cents debe ser bigint (Diamond/Platinum > 2^31-1)
ALTER TABLE public.sponsor_registrations
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS amount_in_cents bigint,
  ADD COLUMN IF NOT EXISTS wompi_transaction_id text;

ALTER TABLE public.sponsor_registrations
  ALTER COLUMN amount_in_cents TYPE bigint
  USING amount_in_cents::bigint;

CREATE UNIQUE INDEX IF NOT EXISTS sponsor_registrations_payment_reference_uidx
  ON public.sponsor_registrations (payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS sponsor_registrations_wompi_tx_idx
  ON public.sponsor_registrations (wompi_transaction_id)
  WHERE wompi_transaction_id IS NOT NULL;

-- Columnas Wompi en expositores
ALTER TABLE public.exhibitor_registrations
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS amount_in_cents bigint,
  ADD COLUMN IF NOT EXISTS wompi_transaction_id text;

ALTER TABLE public.exhibitor_registrations
  ALTER COLUMN amount_in_cents TYPE bigint
  USING amount_in_cents::bigint;

-- Asistentes: también bigint por consistencia
ALTER TABLE public.attendee_registrations
  ALTER COLUMN amount_in_cents TYPE bigint
  USING amount_in_cents::bigint;

CREATE UNIQUE INDEX IF NOT EXISTS exhibitor_registrations_payment_reference_uidx
  ON public.exhibitor_registrations (payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS exhibitor_registrations_wompi_tx_idx
  ON public.exhibitor_registrations (wompi_transaction_id)
  WHERE wompi_transaction_id IS NOT NULL;

-- ------------------------------------------------------------
-- RPC unificado: create_event_wompi_checkout
-- payload.kind: asistente | patrocinador | expositor
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_event_wompi_checkout(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  v_kind text := lower(nullif(trim(payload->>'kind'), ''));
  v_amount bigint;
  v_reference text;
  v_integrity text;
  v_signature text;
  v_id uuid;
  v_legal_id_type text;
  v_customer_name text;
  v_customer_email text;
  v_customer_phone text;
  v_customer_legal_id text;
  v_document_type text;

  -- asistente
  v_seat text;
  v_full_name text;
  v_document_number text;
  v_profile text;
  v_organization text;
  v_interest text;
  v_accompanied uuid;
  v_referral text;
  v_referral_other text;

  -- sponsor / expositor
  v_company_name text;
  v_tax_id text;
  v_contact_name text;
  v_contact_role text;
  v_website text;
  v_plan text;
  v_stand text;
  v_sector text;
  v_comments text;
BEGIN
  IF v_kind IS NULL OR v_kind NOT IN ('asistente', 'patrocinador', 'expositor') THEN
    RAISE EXCEPTION 'Categoría de registro inválida.' USING ERRCODE = '22023';
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
    upper(substr(v_kind, 1, 3)) || '-' ||
    upper(to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint)) ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- ===================== ASISTENTE =====================
  IF v_kind = 'asistente' THEN
    v_seat := nullif(trim(payload->>'seatType'), '');
    v_full_name := nullif(trim(payload->>'fullName'), '');
    v_document_type := nullif(trim(payload->>'documentType'), '');
    v_document_number := nullif(trim(payload->>'documentNumber'), '');
    v_customer_email := lower(nullif(trim(payload->>'email'), ''));
    v_customer_phone := nullif(trim(payload->>'phone'), '');
    v_profile := nullif(trim(payload->>'profile'), '');
    v_organization := nullif(trim(payload->>'organization'), '');
    v_interest := nullif(trim(payload->>'interest'), '');
    v_accompanied := nullif(trim(payload->>'accompaniedCompetitorId'), '')::uuid;
    v_referral := nullif(trim(payload->>'referralSource'), '');
    v_referral_other := nullif(trim(payload->>'referralSourceOther'), '');

    IF v_seat = 'preferencial' THEN
      v_amount := 7990000; -- $79.900
    ELSIF v_seat = 'general' THEN
      v_amount := 5000000; -- $50.000
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
    IF v_customer_email IS NULL OR v_customer_email !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
      RAISE EXCEPTION 'Correo electrónico inválido.' USING ERRCODE = '22023';
    END IF;
    IF v_customer_phone IS NULL OR length(regexp_replace(v_customer_phone, '\D', '', 'g')) < 7 THEN
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

    v_signature := encode(
      digest(
        convert_to(v_reference || v_amount::text || 'COP' || v_integrity, 'UTF8'),
        'sha256'
      ),
      'hex'
    );

    INSERT INTO public.attendee_registrations (
      full_name, document_type, document_number, email, phone,
      profile, organization, interest, seat_type, accompanied_competitor_id,
      referral_source, referral_source_other, status,
      payment_reference, amount_in_cents
    )
    VALUES (
      v_full_name,
      v_document_type::public.attendee_document_type,
      v_document_number,
      v_customer_email,
      v_customer_phone,
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

    v_customer_name := v_full_name;
    v_customer_legal_id := v_document_number;
    v_legal_id_type := CASE v_document_type WHEN 'passport' THEN 'PP' ELSE v_document_type END;

  -- ===================== PATROCINADOR =====================
  ELSIF v_kind = 'patrocinador' THEN
    v_company_name := nullif(trim(payload->>'companyName'), '');
    v_tax_id := nullif(trim(payload->>'taxId'), '');
    v_contact_name := nullif(trim(payload->>'contactName'), '');
    v_contact_role := nullif(trim(payload->>'contactRole'), '');
    v_customer_email := lower(nullif(trim(payload->>'email'), ''));
    v_customer_phone := nullif(trim(payload->>'phone'), '');
    v_website := nullif(trim(payload->>'website'), '');
    v_plan := nullif(trim(payload->>'plan'), '');
    v_sector := nullif(trim(payload->>'sector'), '');
    v_comments := nullif(trim(payload->>'comments'), '');
    v_referral := nullif(trim(payload->>'referralSource'), '');
    v_referral_other := nullif(trim(payload->>'referralSourceOther'), '');

    v_amount := CASE v_plan
      WHEN 'emprendedor' THEN 350000000   -- $3.500.000
      WHEN 'bronce' THEN 690000000        -- $6.900.000
      WHEN 'silver' THEN 1199000000       -- $11.990.000
      WHEN 'diamond' THEN 2500000000      -- $25.000.000
      WHEN 'platinum' THEN 3500000000     -- $35.000.000
      ELSE NULL
    END;

    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Selecciona un plan de vinculación válido.' USING ERRCODE = '22023';
    END IF;
    IF v_company_name IS NULL OR length(v_company_name) < 2 THEN
      RAISE EXCEPTION 'Escribe el nombre de la empresa.' USING ERRCODE = '22023';
    END IF;
    IF v_tax_id IS NULL OR length(v_tax_id) < 5 THEN
      RAISE EXCEPTION 'NIT inválido.' USING ERRCODE = '22023';
    END IF;
    IF v_contact_name IS NULL OR length(v_contact_name) < 3 THEN
      RAISE EXCEPTION 'Escribe el nombre del contacto.' USING ERRCODE = '22023';
    END IF;
    IF v_contact_role IS NULL OR length(v_contact_role) < 2 THEN
      RAISE EXCEPTION 'Indica el cargo del contacto.' USING ERRCODE = '22023';
    END IF;
    IF v_customer_email IS NULL OR v_customer_email !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
      RAISE EXCEPTION 'Correo electrónico inválido.' USING ERRCODE = '22023';
    END IF;
    IF v_customer_phone IS NULL OR length(regexp_replace(v_customer_phone, '\D', '', 'g')) < 7 THEN
      RAISE EXCEPTION 'Teléfono inválido.' USING ERRCODE = '22023';
    END IF;
    IF v_sector IS NULL OR length(v_sector) < 2 THEN
      RAISE EXCEPTION 'Indica el sector de la empresa.' USING ERRCODE = '22023';
    END IF;
    IF v_referral IS NULL THEN
      RAISE EXCEPTION 'Cuéntanos cómo te enteraste.' USING ERRCODE = '22023';
    END IF;
    IF v_referral = 'other' AND (v_referral_other IS NULL OR length(v_referral_other) = 0) THEN
      RAISE EXCEPTION 'Especifica por qué medio te enteraste.' USING ERRCODE = '22023';
    END IF;
    IF v_referral <> 'other' THEN
      v_referral_other := NULL;
    END IF;

    v_signature := encode(
      digest(
        convert_to(v_reference || v_amount::text || 'COP' || v_integrity, 'UTF8'),
        'sha256'
      ),
      'hex'
    );

    INSERT INTO public.sponsor_registrations (
      company_name, tax_id, contact_name, contact_role, email, phone,
      website, plan, sector, comments, referral_source, referral_source_other,
      status, payment_reference, amount_in_cents
    )
    VALUES (
      v_company_name,
      v_tax_id,
      v_contact_name,
      v_contact_role,
      v_customer_email,
      v_customer_phone,
      v_website,
      v_plan::public.sponsor_plan,
      v_sector,
      v_comments,
      v_referral::public.sponsor_referral_source,
      v_referral_other,
      'pending',
      v_reference,
      v_amount
    )
    RETURNING id INTO v_id;

    v_customer_name := v_contact_name;
    v_customer_legal_id := v_tax_id;
    v_legal_id_type := 'NIT';

  -- ===================== EXPOSITOR =====================
  ELSE
    v_company_name := nullif(trim(payload->>'companyName'), '');
    v_tax_id := nullif(trim(payload->>'taxId'), '');
    v_contact_name := nullif(trim(payload->>'contactName'), '');
    v_contact_role := nullif(trim(payload->>'contactRole'), '');
    v_customer_email := lower(nullif(trim(payload->>'email'), ''));
    v_customer_phone := nullif(trim(payload->>'phone'), '');
    v_website := nullif(trim(payload->>'website'), '');
    v_stand := nullif(trim(payload->>'standType'), '');
    v_sector := nullif(trim(payload->>'sector'), '');
    v_comments := nullif(trim(payload->>'comments'), '');
    v_referral := nullif(trim(payload->>'referralSource'), '');
    v_referral_other := nullif(trim(payload->>'referralSourceOther'), '');

    v_amount := CASE v_stand
      WHEN 'stand_2x2' THEN 250000000   -- $2.500.000
      WHEN 'stand_2x16' THEN 150000000  -- $1.500.000
      ELSE NULL
    END;

    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Selecciona un tipo de stand válido.' USING ERRCODE = '22023';
    END IF;
    IF v_company_name IS NULL OR length(v_company_name) < 2 THEN
      RAISE EXCEPTION 'Escribe el nombre de la empresa.' USING ERRCODE = '22023';
    END IF;
    IF v_tax_id IS NULL OR length(v_tax_id) < 5 THEN
      RAISE EXCEPTION 'NIT inválido.' USING ERRCODE = '22023';
    END IF;
    IF v_contact_name IS NULL OR length(v_contact_name) < 3 THEN
      RAISE EXCEPTION 'Escribe el nombre del contacto.' USING ERRCODE = '22023';
    END IF;
    IF v_contact_role IS NULL OR length(v_contact_role) < 2 THEN
      RAISE EXCEPTION 'Indica el cargo del contacto.' USING ERRCODE = '22023';
    END IF;
    IF v_customer_email IS NULL OR v_customer_email !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
      RAISE EXCEPTION 'Correo electrónico inválido.' USING ERRCODE = '22023';
    END IF;
    IF v_customer_phone IS NULL OR length(regexp_replace(v_customer_phone, '\D', '', 'g')) < 7 THEN
      RAISE EXCEPTION 'Teléfono inválido.' USING ERRCODE = '22023';
    END IF;
    IF v_sector IS NULL OR length(v_sector) < 2 THEN
      RAISE EXCEPTION 'Indica el sector de la empresa.' USING ERRCODE = '22023';
    END IF;
    IF v_referral IS NULL THEN
      RAISE EXCEPTION 'Cuéntanos cómo te enteraste.' USING ERRCODE = '22023';
    END IF;
    IF v_referral = 'other' AND (v_referral_other IS NULL OR length(v_referral_other) = 0) THEN
      RAISE EXCEPTION 'Especifica por qué medio te enteraste.' USING ERRCODE = '22023';
    END IF;
    IF v_referral <> 'other' THEN
      v_referral_other := NULL;
    END IF;

    v_signature := encode(
      digest(
        convert_to(v_reference || v_amount::text || 'COP' || v_integrity, 'UTF8'),
        'sha256'
      ),
      'hex'
    );

    INSERT INTO public.exhibitor_registrations (
      company_name, tax_id, contact_name, contact_role, email, phone,
      website, stand_type, sector, comments, referral_source, referral_source_other,
      status, payment_reference, amount_in_cents
    )
    VALUES (
      v_company_name,
      v_tax_id,
      v_contact_name,
      v_contact_role,
      v_customer_email,
      v_customer_phone,
      v_website,
      v_stand::public.exhibitor_stand_type,
      v_sector,
      v_comments,
      v_referral::public.exhibitor_referral_source,
      v_referral_other,
      'pending',
      v_reference,
      v_amount
    )
    RETURNING id INTO v_id;

    v_customer_name := v_contact_name;
    v_customer_legal_id := v_tax_id;
    v_legal_id_type := 'NIT';
  END IF;

  RETURN jsonb_build_object(
    'registrationId', v_id,
    'kind', v_kind,
    'currency', 'COP',
    'amountInCents', v_amount,
    'reference', v_reference,
    'signatureIntegrity', v_signature,
    'customerData', jsonb_build_object(
      'email', v_customer_email,
      'fullName', v_customer_name,
      'phoneNumber', regexp_replace(v_customer_phone, '\D', '', 'g'),
      'phoneNumberPrefix', '+57',
      'legalId', v_customer_legal_id,
      'legalIdType', v_legal_id_type
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION
      'Ya existe un registro con ese correo o documento/NIT. Si ya te inscribiste, revisa tu correo o escríbenos.'
      USING ERRCODE = '23505';
END;
$$;

REVOKE ALL ON FUNCTION public.create_event_wompi_checkout(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_event_wompi_checkout(jsonb) TO anon, authenticated;

COMMENT ON FUNCTION public.create_event_wompi_checkout(jsonb) IS
  'Crea inscripción (asistente/patrocinador/expositor) + firma Wompi sin exponer el secreto.';

-- Compat: asistentes antiguos siguen funcionando con montos reales
CREATE OR REPLACE FUNCTION public.create_attendee_wompi_checkout(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
BEGIN
  RETURN public.create_event_wompi_checkout(
    coalesce(payload, '{}'::jsonb) || jsonb_build_object('kind', 'asistente')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_attendee_wompi_checkout(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_attendee_wompi_checkout(jsonb) TO anon, authenticated;
