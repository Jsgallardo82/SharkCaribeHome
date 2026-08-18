-- ============================================================
-- Shark Caribe 2026 · Ranking público en vivo · 2ª ronda
-- Ejecutar en el SQL Editor de Supabase.
-- Agrega promedios por concursante SIN juror_id ni observaciones.
-- ============================================================

DROP VIEW IF EXISTS public.jury_round2_live_ranking;

CREATE VIEW public.jury_round2_live_ranking
WITH (security_invoker = false)
AS
SELECT
  s.competitor_id,
  c.venture_name,
  c.full_name,
  c.category,
  c.logo_url,
  count(*)::int AS jury_count,
  round(avg(s.viabilidad_financiera)::numeric, 2) AS avg_viabilidad_financiera,
  round(avg(s.estrategia_comercial)::numeric, 2) AS avg_estrategia_comercial,
  round(avg(s.preparacion_inversion)::numeric, 2) AS avg_preparacion_inversion,
  round(avg(s.presencia_ejecutiva)::numeric, 2) AS avg_presencia_ejecutiva,
  round(avg(s.innovacion_aplicada)::numeric, 2) AS avg_innovacion_aplicada,
  round(avg(s.total)::numeric, 2) AS avg_total
FROM public.jury_scores_round2 s
JOIN public.competitor_registrations c ON c.id = s.competitor_id
GROUP BY
  s.competitor_id,
  c.venture_name,
  c.full_name,
  c.category,
  c.logo_url;

GRANT SELECT ON public.jury_round2_live_ranking TO anon, authenticated;

COMMENT ON VIEW public.jury_round2_live_ranking IS
  'Ranking agregado 2ª ronda para pantalla pública en vivo (sin jurados ni observaciones).';
