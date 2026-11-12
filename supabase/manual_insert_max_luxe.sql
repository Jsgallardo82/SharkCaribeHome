-- ============================================================
-- Insert manual · Lauren De la Cruz Valdés / Max Luxe
-- Sin logo (logo_url queda NULL).
-- Documento, correo, celular, fecha y texto son placeholders:
-- la tabla y el trigger de edad los exigen.
-- birth_date en rango Prime (18 a 49).
-- ============================================================

DROP TRIGGER IF EXISTS competitor_registrations_deadline
  ON public.competitor_registrations;

INSERT INTO public.competitor_registrations (
  accepted_terms,
  full_name,
  document_type,
  document_number,
  birth_date,
  category,
  preferred_contact,
  phone,
  email,
  venture_name,
  sector,
  problem_solved,
  referral_source,
  referral_source_other,
  logo_url,
  status,
  competition_stage
)
VALUES (
  true,
  'Lauren De la Cruz Valdés',
  'CC',
  '9001001004',
  '1990-01-01',
  'prime',
  'whatsapp',
  '3000000004',
  'manual.maxluxe@sharkcaribe.local',
  'Max Luxe',
  'madera_construccion_ligera',
  'Pendiente de completar.',
  'recomendacion',
  NULL,
  NULL,
  'pago',
  'final'
);

CREATE TRIGGER competitor_registrations_deadline
  BEFORE INSERT ON public.competitor_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_competitor_registration_deadline();

SELECT id, full_name, venture_name, sector, logo_url, status, competition_stage, category, birth_date
FROM public.competitor_registrations
WHERE venture_name = 'Max Luxe';
