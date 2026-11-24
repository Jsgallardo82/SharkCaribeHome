-- ============================================================
-- Shark Caribe 2026 · Calificaciones jurado · Fogueo de la final
-- Ejecutar TODO en el SQL Editor de Supabase.
-- Reemplaza la tabla anterior (cinco criterios sobre 25) por la
-- rúbrica de fogueo: seis notas de 1 a 5, puntos = nota ÷ 5 × peso,
-- total sobre 100. Lista a quien está en etapa final.
-- Volver a ejecutarlo borra las calificaciones de fogueo ya guardadas.
-- ============================================================

DROP TABLE IF EXISTS public.jury_scores_final CASCADE;

CREATE TABLE public.jury_scores_final (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  juror_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  competitor_id uuid NOT NULL REFERENCES public.competitor_registrations (id) ON DELETE CASCADE,

  dominio_precision smallint NOT NULL
    CHECK (dominio_precision BETWEEN 1 AND 5),
  sustento_evidencia smallint NOT NULL
    CHECK (sustento_evidencia BETWEEN 1 AND 5),
  coherencia_pitch smallint NOT NULL
    CHECK (coherencia_pitch BETWEEN 1 AND 5),
  manejo_objeciones smallint NOT NULL
    CHECK (manejo_objeciones BETWEEN 1 AND 5),
  capacidad_negociacion smallint NOT NULL
    CHECK (capacidad_negociacion BETWEEN 1 AND 5),
  claridad_sintesis smallint NOT NULL
    CHECK (claridad_sintesis BETWEEN 1 AND 5),

  /* nota × peso / 5. Los pesos suman 100 y son múltiplos de 5. */
  total smallint GENERATED ALWAYS AS (
    (
      (
        dominio_precision * 25
        + sustento_evidencia * 20
        + coherencia_pitch * 15
        + manejo_objeciones * 15
        + capacidad_negociacion * 15
        + claridad_sintesis * 10
      ) / 5
    )::smallint
  ) STORED,

  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT jury_scores_final_unique_juror_competitor
    UNIQUE (juror_id, competitor_id)
);

CREATE INDEX IF NOT EXISTS jury_scores_final_competitor_id_idx
  ON public.jury_scores_final (competitor_id);

CREATE INDEX IF NOT EXISTS jury_scores_final_juror_id_idx
  ON public.jury_scores_final (juror_id);

COMMENT ON TABLE public.jury_scores_final IS
  'Calificaciones de fogueo de la final. Seis notas 1–5; total = suma de (nota × peso / 5), sobre 100.';

CREATE OR REPLACE FUNCTION public.set_jury_scores_final_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jury_scores_final_set_updated_at
  ON public.jury_scores_final;

CREATE TRIGGER jury_scores_final_set_updated_at
  BEFORE UPDATE ON public.jury_scores_final
  FOR EACH ROW
  EXECUTE FUNCTION public.set_jury_scores_final_updated_at();

DROP VIEW IF EXISTS public.jury_final_competitors;

CREATE VIEW public.jury_final_competitors
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
WHERE competition_stage = 'final'
ORDER BY venture_name ASC NULLS LAST, full_name ASC;

GRANT SELECT ON public.jury_final_competitors TO authenticated;

COMMENT ON VIEW public.jury_final_competitors IS
  'Concursantes en etapa final para el panel del jurado.';

ALTER TABLE public.jury_scores_final ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jury_scores_final_select_own_or_admin"
  ON public.jury_scores_final;
CREATE POLICY "jury_scores_final_select_own_or_admin"
  ON public.jury_scores_final
  FOR SELECT
  TO authenticated
  USING (
    juror_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "jury_scores_final_insert_juror"
  ON public.jury_scores_final;
CREATE POLICY "jury_scores_final_insert_juror"
  ON public.jury_scores_final
  FOR INSERT
  TO authenticated
  WITH CHECK (
    juror_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'jurado'
    )
  );

DROP POLICY IF EXISTS "jury_scores_final_update_juror"
  ON public.jury_scores_final;
CREATE POLICY "jury_scores_final_update_juror"
  ON public.jury_scores_final
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

GRANT SELECT, INSERT, UPDATE ON public.jury_scores_final TO authenticated;
