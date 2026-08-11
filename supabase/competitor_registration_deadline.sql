-- Cierre de inscripción de competidores
-- Rechaza INSERT en competitor_registrations a partir de 2026-08-11 00:00 America/Bogota
-- Debe coincidir con COMPETITOR_REGISTRATION_CLOSES_AT en src/data/content.js

CREATE OR REPLACE FUNCTION public.enforce_competitor_registration_deadline()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  closes_at timestamptz := timestamptz '2026-08-11 00:00:00-05';
BEGIN
  IF clock_timestamp() >= closes_at THEN
    RAISE EXCEPTION 'La convocatoria de competidores ya cerró.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS competitor_registrations_deadline
  ON public.competitor_registrations;

CREATE TRIGGER competitor_registrations_deadline
  BEFORE INSERT ON public.competitor_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_competitor_registration_deadline();

-- Para quitar el candado:
-- DROP TRIGGER IF EXISTS competitor_registrations_deadline
--   ON public.competitor_registrations;
