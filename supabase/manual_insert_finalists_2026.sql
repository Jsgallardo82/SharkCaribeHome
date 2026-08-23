-- ============================================================
-- Insert manual · 3 concursantes (KEFP, ALORA, TULIPANCITO)
-- birth_date placeholder en rango Prime (el trigger lo exige).
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
VALUES
  (
    true,
    'Estefanía Pedrozo',
    'CC',
    '9001001001',
    '1990-01-01',
    'prime',
    'whatsapp',
    '3000000001',
    'manual.kefp@sharkcaribe.local',
    'KEFP',
    'manualidades',
    'Pendiente de completar.',
    'other',
    'Carga manual admin',
    'https://jcrjvtpylprlcvojxuvw.supabase.co/storage/v1/object/public/logos/kefp.jpeg',
    'pago',
    'final'
  ),
  (
    true,
    'Vanessa Uribe',
    'CC',
    '9001001002',
    '1990-01-01',
    'prime',
    'whatsapp',
    '3000000002',
    'manual.alora@sharkcaribe.local',
    'ALORA',
    'manualidades',
    'Pendiente de completar.',
    'other',
    'Carga manual admin',
    'https://jcrjvtpylprlcvojxuvw.supabase.co/storage/v1/object/public/logos/alora.jpeg',
    'pago',
    'final'
  ),
  (
    true,
    'Rosa Isella Anaya',
    'CC',
    '9001001003',
    '1990-01-01',
    'prime',
    'whatsapp',
    '3000000003',
    'manual.tulipancito@sharkcaribe.local',
    'TULIPANCITO GURUMI',
    'manualidades',
    'Pendiente de completar.',
    'other',
    'Carga manual admin',
    'https://jcrjvtpylprlcvojxuvw.supabase.co/storage/v1/object/public/logos/tulipancito.jpeg',
    'pago',
    'final'
  );

CREATE TRIGGER competitor_registrations_deadline
  BEFORE INSERT ON public.competitor_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_competitor_registration_deadline();

SELECT id, full_name, venture_name, logo_url, status, competition_stage, category, birth_date
FROM public.competitor_registrations
WHERE venture_name IN ('KEFP', 'ALORA', 'TULIPANCITO GURUMI')
ORDER BY venture_name;
