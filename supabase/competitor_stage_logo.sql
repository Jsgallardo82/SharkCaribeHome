-- ============================================================
-- Shark Caribe 2026 · Avance en competencia + logo
-- Tabla: competitor_registrations
-- Pegar TODO en el SQL Editor de Supabase y ejecutar.
--
-- competition_stage:
--   pendiente → aprobado → segunda_vuelta → tercera_vuelta → final → ganador
--   rechazado (con rejection_reason)
-- logo_url: URL del logo del emprendimiento
--
-- No se toca status (esa columna sigue siendo pago/revisión).
-- ============================================================

-- ------------------------------------------------------------
-- 0) Si corriste la versión anterior (inscrito / eliminated), limpia primero
-- ------------------------------------------------------------
ALTER TABLE public.competitor_registrations
  DROP COLUMN IF EXISTS competition_stage,
  DROP COLUMN IF EXISTS eliminated;

DROP TYPE IF EXISTS public.competitor_competition_stage;

-- ------------------------------------------------------------
-- 1) Enum de avance
-- ------------------------------------------------------------
CREATE TYPE public.competitor_competition_stage AS ENUM (
  'pendiente',
  'aprobado',
  'segunda_vuelta',
  'tercera_vuelta',
  'final',
  'ganador',
  'rechazado'
);

-- ------------------------------------------------------------
-- 2) Columnas
-- ------------------------------------------------------------
ALTER TABLE public.competitor_registrations
  ADD COLUMN IF NOT EXISTS competition_stage public.competitor_competition_stage
    NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

COMMENT ON COLUMN public.competitor_registrations.competition_stage IS
  'Avance en la competencia. rechazado requiere rejection_reason.';

COMMENT ON COLUMN public.competitor_registrations.logo_url IS
  'URL pública del logo del emprendimiento.';

COMMENT ON COLUMN public.competitor_registrations.rejection_reason IS
  'Motivo de rechazo / eliminación del concurso (cuando competition_stage = rechazado).';

CREATE INDEX IF NOT EXISTS competitor_registrations_competition_stage_idx
  ON public.competitor_registrations (competition_stage);

-- ------------------------------------------------------------
-- 3) UPDATE para admin
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "competitor_registrations_update_admin" ON public.competitor_registrations;
CREATE POLICY "competitor_registrations_update_admin"
  ON public.competitor_registrations
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

GRANT UPDATE ON public.competitor_registrations TO authenticated;
