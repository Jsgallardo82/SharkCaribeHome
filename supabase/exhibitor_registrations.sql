-- ============================================================
-- Shark Caribe 2026 · Inscripciones expositores (muestra comercial)
-- Pegar TODO en el SQL Editor de Supabase y ejecutar.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Enums
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.exhibitor_stand_type AS ENUM ('stand_2x2', 'stand_2x16');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.exhibitor_referral_source AS ENUM (
    'instagram',
    'sergio_arboleda',
    'universidad_autonoma_del_caribe',
    'cc_buenavista',
    'sena',
    'recomendacion',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 2) Tabla: expositores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exhibitor_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  tax_id text NOT NULL,
  contact_name text NOT NULL,
  contact_role text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  website text,
  stand_type public.exhibitor_stand_type NOT NULL,
  sector text NOT NULL,
  comments text,
  referral_source public.exhibitor_referral_source NOT NULL,
  referral_source_other text,
  status text NOT NULL DEFAULT 'pending',
  payment_confirmation text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exhibitor_registrations_email_unique UNIQUE (email),
  CONSTRAINT exhibitor_registrations_tax_id_unique UNIQUE (tax_id),
  CONSTRAINT exhibitor_registrations_status_check CHECK (status IN ('pending', 'pago')),
  CONSTRAINT exhibitor_registrations_referral_other_check CHECK (
    (referral_source = 'other' AND referral_source_other IS NOT NULL AND length(trim(referral_source_other)) > 0)
    OR (referral_source <> 'other' AND referral_source_other IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS exhibitor_registrations_created_at_idx
  ON public.exhibitor_registrations (created_at DESC);

CREATE INDEX IF NOT EXISTS exhibitor_registrations_stand_type_idx
  ON public.exhibitor_registrations (stand_type);

-- ------------------------------------------------------------
-- 3) RLS + permisos
-- ------------------------------------------------------------
ALTER TABLE public.exhibitor_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exhibitor_registrations_insert_anon" ON public.exhibitor_registrations;
CREATE POLICY "exhibitor_registrations_insert_anon"
  ON public.exhibitor_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "exhibitor_registrations_select_authenticated" ON public.exhibitor_registrations;
CREATE POLICY "exhibitor_registrations_select_authenticated"
  ON public.exhibitor_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "exhibitor_registrations_update_admin" ON public.exhibitor_registrations;
CREATE POLICY "exhibitor_registrations_update_admin"
  ON public.exhibitor_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT INSERT ON public.exhibitor_registrations TO anon, authenticated;
GRANT SELECT, UPDATE ON public.exhibitor_registrations TO authenticated;
