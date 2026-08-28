-- ============================================================
-- Check-in + token QR de asistentes
-- Ejecutar en Supabase → SQL Editor
-- (Requiere: attendee_ticket_number.sql ya aplicado)
-- ============================================================

-- 0) Asegura is_admin() (si ya existe, no pasa nada)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 1) Token único del QR
ALTER TABLE public.attendee_registrations
  ADD COLUMN IF NOT EXISTS ticket_token uuid;

UPDATE public.attendee_registrations
SET ticket_token = gen_random_uuid()
WHERE ticket_token IS NULL;

ALTER TABLE public.attendee_registrations
  ALTER COLUMN ticket_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.attendee_registrations
  ALTER COLUMN ticket_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS attendee_registrations_ticket_token_uidx
  ON public.attendee_registrations (ticket_token);

COMMENT ON COLUMN public.attendee_registrations.ticket_token IS
  'UUID único embebido en el QR del boleto.';

-- 2) Marca de ingreso al evento
ALTER TABLE public.attendee_registrations
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

COMMENT ON COLUMN public.attendee_registrations.checked_in_at IS
  'Momento en que el asistente ingresó al evento (NULL = no ha ingresado).';

CREATE INDEX IF NOT EXISTS attendee_registrations_checked_in_at_idx
  ON public.attendee_registrations (checked_in_at)
  WHERE checked_in_at IS NOT NULL;

-- 3) Backfill: números para pagos ya pagados sin ticket_number
WITH ordered AS (
  SELECT id
  FROM public.attendee_registrations
  WHERE status = 'pago' AND ticket_number IS NULL
  ORDER BY reviewed_at NULLS LAST, created_at ASC
)
UPDATE public.attendee_registrations a
SET ticket_number = nextval('public.attendee_ticket_number_seq')::integer
FROM ordered o
WHERE a.id = o.id;

-- 4) Check-in por token (solo admin)
CREATE OR REPLACE FUNCTION public.check_in_attendee_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.attendee_registrations%ROWTYPE;
BEGIN
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_token');
  END IF;

  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO rec
  FROM public.attendee_registrations
  WHERE ticket_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF coalesce(rec.status, '') IS DISTINCT FROM 'pago' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'not_paid',
      'full_name', rec.full_name,
      'ticket_number', rec.ticket_number,
      'status', rec.status
    );
  END IF;

  IF rec.checked_in_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already', true,
      'id', rec.id,
      'full_name', rec.full_name,
      'email', rec.email,
      'seat_type', rec.seat_type,
      'ticket_number', rec.ticket_number,
      'checked_in_at', rec.checked_in_at
    );
  END IF;

  UPDATE public.attendee_registrations
  SET checked_in_at = now(),
      updated_at = now()
  WHERE id = rec.id
  RETURNING * INTO rec;

  RETURN jsonb_build_object(
    'ok', true,
    'already', false,
    'id', rec.id,
    'full_name', rec.full_name,
    'email', rec.email,
    'seat_type', rec.seat_type,
    'ticket_number', rec.ticket_number,
    'checked_in_at', rec.checked_in_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_attendee_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_attendee_by_token(uuid) TO authenticated;

-- 5) Check-in / undo por id (lista Admin)
CREATE OR REPLACE FUNCTION public.set_attendee_checked_in(p_id uuid, p_checked_in boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.attendee_registrations%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO rec FROM public.attendee_registrations WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF coalesce(rec.status, '') IS DISTINCT FROM 'pago' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_paid');
  END IF;

  UPDATE public.attendee_registrations
  SET checked_in_at = CASE WHEN p_checked_in THEN coalesce(checked_in_at, now()) ELSE NULL END,
      updated_at = now()
  WHERE id = p_id
  RETURNING * INTO rec;

  RETURN jsonb_build_object(
    'ok', true,
    'id', rec.id,
    'full_name', rec.full_name,
    'ticket_number', rec.ticket_number,
    'checked_in_at', rec.checked_in_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_attendee_checked_in(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_attendee_checked_in(uuid, boolean) TO authenticated;

-- Verificar:
-- SELECT id, email, status, ticket_number, ticket_token, checked_in_at
-- FROM public.attendee_registrations
-- ORDER BY ticket_number NULLS LAST, created_at DESC
-- LIMIT 20;
