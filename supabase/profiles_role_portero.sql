-- ============================================================
-- Shark Caribe 2026 · Rol de cuenta: portero
-- Ejecutar TODO en el SQL Editor de Supabase.
--
-- Agrega el rol portero (no quita admin, jurado ni los demás).
-- El portero puede marcar ingreso leyendo el QR.
-- No puede deshacer un ingreso ni usar el panel de admin.
-- ============================================================

/* ------------------------------------------------------------
   Caso A: role es TEXT con CHECK constraint
   ------------------------------------------------------------ */
DO $$
DECLARE
  cons_name text;
  cons_def  text;
BEGIN
  SELECT c.conname, pg_get_constraintdef(c.oid)
    INTO cons_name, cons_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'profiles'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LIMIT 1;

  IF cons_name IS NOT NULL THEN
    IF cons_def ILIKE '%portero%' THEN
      RAISE NOTICE 'El CHECK % ya permite portero.', cons_name;
    ELSE
      EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cons_name);
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_role_check
        CHECK (
          role IN (
            'admin',
            'patrocinador',
            'asistente',
            'concursante',
            'jurado',
            'portero'
          )
        );
      RAISE NOTICE 'CHECK actualizado: incluye portero.';
    END IF;
  ELSE
    RAISE NOTICE 'No se encontró CHECK de role en profiles (puede ser enum o texto libre).';
  END IF;
END $$;

/* ------------------------------------------------------------
   Caso B: role es un ENUM de Postgres
   ------------------------------------------------------------ */
DO $$
DECLARE
  enum_type text;
BEGIN
  SELECT t.typname
    INTO enum_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
    AND a.attname = 'role'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND t.typtype = 'e'
  LIMIT 1;

  IF enum_type IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = enum_type
        AND e.enumlabel = 'portero'
    ) THEN
      RAISE NOTICE 'El enum % ya incluye portero.', enum_type;
    ELSE
      EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', enum_type, 'portero');
      RAISE NOTICE 'Valor portero agregado al enum %.', enum_type;
    END IF;
  ELSE
    RAISE NOTICE 'profiles.role no es un enum.';
  END IF;
EXCEPTION
  WHEN syntax_error THEN
    BEGIN
      EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type, 'portero');
      RAISE NOTICE 'Valor portero agregado al enum % (sin IF NOT EXISTS).', enum_type;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'portero ya existía en el enum.';
    END;
END $$;

COMMENT ON COLUMN public.profiles.role IS
  'Rol de cuenta: admin | patrocinador | asistente | concursante | jurado | portero';

/* ------------------------------------------------------------
   Check-in por QR: admin o portero.
   Desmarcar un ingreso sigue siendo solo admin.
   ------------------------------------------------------------ */
CREATE OR REPLACE FUNCTION public.check_in_attendee_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.attendee_registrations%ROWTYPE;
  actor_role text;
BEGIN
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_token');
  END IF;

  SELECT role::text
    INTO actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF actor_role IS NULL OR actor_role NOT IN ('admin', 'portero') THEN
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

/* ------------------------------------------------------------
   Lista de invitados para la puerta.
   Solo boletas con pago. Sin token, sin montos, sin datos de Wompi.
   ------------------------------------------------------------ */
CREATE OR REPLACE FUNCTION public.list_event_guests()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  document_number text,
  phone text,
  seat_type text,
  ticket_number integer,
  checked_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text IN ('admin', 'portero')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.full_name,
    a.email,
    a.document_number,
    a.phone,
    a.seat_type::text,
    a.ticket_number,
    a.checked_in_at
  FROM public.attendee_registrations a
  WHERE a.status = 'pago'
  ORDER BY a.full_name ASC NULLS LAST, a.ticket_number ASC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.list_event_guests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_event_guests() TO authenticated;

/* ------------------------------------------------------------
   Ingreso desde la lista. El portero solo puede marcar,
   no puede quitar un ingreso ya registrado.
   ------------------------------------------------------------ */
CREATE OR REPLACE FUNCTION public.set_attendee_checked_in(p_id uuid, p_checked_in boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.attendee_registrations%ROWTYPE;
  actor_role text;
BEGIN
  SELECT role::text
    INTO actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF actor_role IS NULL OR actor_role NOT IN ('admin', 'portero') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF actor_role = 'portero' AND p_checked_in IS NOT TRUE THEN
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

/* ------------------------------------------------------------
   Después de crear el usuario en Authentication → Users,
   corre ESTO en una segunda pasada, con el correo real.
   Si el perfil aún no existe, lo crea. Si existe, le pone portero.
   ------------------------------------------------------------

INSERT INTO public.profiles (id, email, role)
SELECT u.id, u.email, 'portero'
FROM auth.users u
WHERE lower(u.email) = lower('portero@ejemplo.com')
ON CONFLICT (id) DO UPDATE
SET role = 'portero',
    email = EXCLUDED.email;

SELECT id, email, role
FROM public.profiles
WHERE lower(email) = lower('portero@ejemplo.com');
   ------------------------------------------------------------ */
