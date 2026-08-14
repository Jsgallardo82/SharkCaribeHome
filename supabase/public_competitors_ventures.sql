-- ============================================================
-- Shark Caribe 2026 · Vista pública de emprendimientos (Ventures)
-- Ejecutar en el SQL Editor de Supabase.
-- Muestra inscritos con o sin pago confirmado (oculta rechazados).
-- ============================================================

CREATE OR REPLACE VIEW public.public_competitors
WITH (security_invoker = false)
AS
SELECT
  id,
  full_name,
  venture_name,
  sector,
  logo_url,
  competition_stage
FROM public.competitor_registrations
WHERE status IN ('pending', 'pago')
  AND competition_stage IS DISTINCT FROM 'rechazado'
ORDER BY venture_name ASC NULLS LAST, full_name ASC;

GRANT SELECT ON public.public_competitors TO anon, authenticated;

COMMENT ON VIEW public.public_competitors IS
  'Listado público de emprendimientos inscritos (pending o pago), sin rechazados.';
