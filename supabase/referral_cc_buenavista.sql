-- ============================================================
-- Referral: añadir CC Buenavista (y dejar de ofrecer Autónoma en UI)
-- Ejecutar en SQL Editor de Supabase.
-- ============================================================
-- Nota: PostgreSQL no permite quitar valores de un ENUM fácilmente.
-- universidad_autonoma_del_caribe sigue existiendo en DB por si hay
-- filas históricas; solo se ocultó en el formulario.
-- ============================================================

ALTER TYPE public.attendee_referral_source
  ADD VALUE IF NOT EXISTS 'cc_buenavista';

ALTER TYPE public.sponsor_referral_source
  ADD VALUE IF NOT EXISTS 'cc_buenavista';

ALTER TYPE public.exhibitor_referral_source
  ADD VALUE IF NOT EXISTS 'cc_buenavista';
