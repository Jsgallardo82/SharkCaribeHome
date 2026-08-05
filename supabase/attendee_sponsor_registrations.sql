-- ============================================================
-- Shark Caribe 2026 · Inscripciones asistentes y patrocinadores
-- Pegar TODO en el SQL Editor de Supabase y ejecutar.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Pregunta: ¿A través de qué medio se enteró del Pitch
--    Competition Shark Caribe 2026?
--    Columna: competitor_registrations.referral_source
--    Añade: Universidad Autónoma del Caribe (+ Recomendación)
-- ------------------------------------------------------------
DO $$
DECLARE
  enum_name text;
BEGIN
  SELECT t.typname INTO enum_name
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public'
    AND c.relname = 'competitor_registrations'
    AND a.attname = 'referral_source'
    AND t.typtype = 'e'
  LIMIT 1;

  IF enum_name IS NULL THEN
    RAISE EXCEPTION
      'No hay enum en competitor_registrations.referral_source. Revisa el nombre del tipo.';
  END IF;

  EXECUTE format(
    'ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L',
    enum_name,
    'universidad_autonoma_del_caribe'
  );
  EXECUTE format(
    'ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L',
    enum_name,
    'recomendacion'
  );

  RAISE NOTICE
    'OK: añadidos universidad_autonoma_del_caribe y recomendacion a enum %',
    enum_name;
END $$;

-- ------------------------------------------------------------
-- 2) Enums de asistentes / patrocinadores
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.attendee_document_type AS ENUM ('TI', 'CC', 'CE', 'passport');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attendee_profile AS ENUM (
    'emprendedor',
    'inversionista',
    'ejecutivo',
    'estudiante',
    'mentor',
    'publico_general',
    'delegacion_acompanante'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attendee_interest AS ENUM (
    'networking',
    'inversion',
    'tendencias',
    'aprender'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attendee_seat_type AS ENUM ('preferencial', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attendee_referral_source AS ENUM (
    'instagram',
    'sergio_arboleda',
    'universidad_autonoma_del_caribe',
    'sena',
    'recomendacion',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sponsor_plan AS ENUM (
    'emprendedor',
    'bronce',
    'silver',
    'diamond',
    'platinum',
    'emprendedor_bronce',
    'elite',
    'muestra_comercial',
    'aliado_institucional'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sponsor_referral_source AS ENUM (
    'instagram',
    'sergio_arboleda',
    'universidad_autonoma_del_caribe',
    'sena',
    'recomendacion',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 3) Tabla: asistentes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendee_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  document_type public.attendee_document_type NOT NULL,
  document_number text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  profile public.attendee_profile NOT NULL,
  organization text,
  interest public.attendee_interest NOT NULL,
  seat_type public.attendee_seat_type NOT NULL,
  accompanied_competitor_id uuid REFERENCES public.competitor_registrations (id),
  referral_source public.attendee_referral_source NOT NULL,
  referral_source_other text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendee_registrations_email_unique UNIQUE (email),
  CONSTRAINT attendee_registrations_document_unique UNIQUE (document_number),
  CONSTRAINT attendee_registrations_referral_other_check CHECK (
    (referral_source = 'other' AND referral_source_other IS NOT NULL AND length(trim(referral_source_other)) > 0)
    OR (referral_source <> 'other' AND referral_source_other IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS attendee_registrations_created_at_idx
  ON public.attendee_registrations (created_at DESC);

-- ------------------------------------------------------------
-- 4) Tabla: patrocinadores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsor_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  tax_id text NOT NULL,
  contact_name text NOT NULL,
  contact_role text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  website text,
  plan public.sponsor_plan NOT NULL,
  sector text NOT NULL,
  comments text,
  referral_source public.sponsor_referral_source NOT NULL,
  referral_source_other text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsor_registrations_email_unique UNIQUE (email),
  CONSTRAINT sponsor_registrations_tax_id_unique UNIQUE (tax_id),
  CONSTRAINT sponsor_registrations_referral_other_check CHECK (
    (referral_source = 'other' AND referral_source_other IS NOT NULL AND length(trim(referral_source_other)) > 0)
    OR (referral_source <> 'other' AND referral_source_other IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS sponsor_registrations_created_at_idx
  ON public.sponsor_registrations (created_at DESC);

-- ------------------------------------------------------------
-- 5) Vista pública de emprendedores con pago confirmado
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_competitors
WITH (security_invoker = false)
AS
SELECT id, full_name, venture_name
FROM public.competitor_registrations
WHERE status = 'pago'
ORDER BY venture_name ASC, full_name ASC;

GRANT SELECT ON public.public_competitors TO anon, authenticated;

-- ------------------------------------------------------------
-- 6) RLS + permisos
-- ------------------------------------------------------------
ALTER TABLE public.attendee_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendee_registrations_insert_anon" ON public.attendee_registrations;
CREATE POLICY "attendee_registrations_insert_anon"
  ON public.attendee_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "sponsor_registrations_insert_anon" ON public.sponsor_registrations;
CREATE POLICY "sponsor_registrations_insert_anon"
  ON public.sponsor_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "attendee_registrations_select_authenticated" ON public.attendee_registrations;
CREATE POLICY "attendee_registrations_select_authenticated"
  ON public.attendee_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "sponsor_registrations_select_authenticated" ON public.sponsor_registrations;
CREATE POLICY "sponsor_registrations_select_authenticated"
  ON public.sponsor_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT INSERT ON public.attendee_registrations TO anon, authenticated;
GRANT INSERT ON public.sponsor_registrations TO anon, authenticated;
GRANT SELECT ON public.attendee_registrations TO authenticated;
GRANT SELECT ON public.sponsor_registrations TO authenticated;
