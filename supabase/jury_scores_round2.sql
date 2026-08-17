-- ============================================================
-- Shark Caribe 2026 · Calificaciones jurado · 2ª ronda
-- Ejecutar TODO en el SQL Editor de Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.jury_scores_round2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  juror_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  competitor_id uuid NOT NULL REFERENCES public.competitor_registrations (id) ON DELETE CASCADE,

  viabilidad_financiera smallint NOT NULL
    CHECK (viabilidad_financiera BETWEEN 1 AND 5),
  estrategia_comercial smallint NOT NULL
    CHECK (estrategia_comercial BETWEEN 1 AND 5),
  preparacion_inversion smallint NOT NULL
    CHECK (preparacion_inversion BETWEEN 1 AND 5),
  presencia_ejecutiva smallint NOT NULL
    CHECK (presencia_ejecutiva BETWEEN 1 AND 5),
  innovacion_aplicada smallint NOT NULL
    CHECK (innovacion_aplicada BETWEEN 1 AND 5),

  total smallint GENERATED ALWAYS AS (
    viabilidad_financiera
    + estrategia_comercial
    + preparacion_inversion
    + presencia_ejecutiva
    + innovacion_aplicada
  ) STORED,

  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT jury_scores_round2_unique_juror_competitor
    UNIQUE (juror_id, competitor_id)
);

CREATE INDEX IF NOT EXISTS jury_scores_round2_competitor_id_idx
  ON public.jury_scores_round2 (competitor_id);

CREATE INDEX IF NOT EXISTS jury_scores_round2_juror_id_idx
  ON public.jury_scores_round2 (juror_id);

COMMENT ON TABLE public.jury_scores_round2 IS
  'Calificaciones de jurados para la 2ª ronda (criterios 1–5 + total generado).';

CREATE OR REPLACE FUNCTION public.set_jury_scores_round2_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jury_scores_round2_set_updated_at
  ON public.jury_scores_round2;

CREATE TRIGGER jury_scores_round2_set_updated_at
  BEFORE UPDATE ON public.jury_scores_round2
  FOR EACH ROW
  EXECUTE FUNCTION public.set_jury_scores_round2_updated_at();

DROP VIEW IF EXISTS public.jury_round2_competitors;

CREATE VIEW public.jury_round2_competitors
WITH (security_invoker = false)
AS
SELECT
  id,
  full_name,
  venture_name,
  sector,
  category,
  logo_url
FROM public.competitor_registrations
WHERE competition_stage = 'segunda_vuelta'
ORDER BY venture_name ASC NULLS LAST, full_name ASC;

GRANT SELECT ON public.jury_round2_competitors TO authenticated;

COMMENT ON VIEW public.jury_round2_competitors IS
  'Concursantes en segunda_vuelta para el panel del jurado.';

ALTER TABLE public.jury_scores_round2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jury_scores_round2_select_own_or_admin"
  ON public.jury_scores_round2;
CREATE POLICY "jury_scores_round2_select_own_or_admin"
  ON public.jury_scores_round2
  FOR SELECT
  TO authenticated
  USING (
    juror_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "jury_scores_round2_insert_juror"
  ON public.jury_scores_round2;
CREATE POLICY "jury_scores_round2_insert_juror"
  ON public.jury_scores_round2
  FOR INSERT
  TO authenticated
  WITH CHECK (
    juror_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'jurado'
    )
  );

DROP POLICY IF EXISTS "jury_scores_round2_update_juror"
  ON public.jury_scores_round2;
CREATE POLICY "jury_scores_round2_update_juror"
  ON public.jury_scores_round2
  FOR UPDATE
  TO authenticated
  USING (
    juror_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'jurado'
    )
  )
  WITH CHECK (
    juror_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'jurado'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.jury_scores_round2 TO authenticated;
