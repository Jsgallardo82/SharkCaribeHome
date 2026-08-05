-- ============================================================
-- Pago: columnas + RLS UPDATE (asistentes y patrocinadores)
-- Ejecutar en el SQL Editor de Supabase (si aún no se corrió).
-- ============================================================

ALTER TABLE public.attendee_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_confirmation text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.attendee_registrations
  DROP CONSTRAINT IF EXISTS attendee_registrations_status_check;

ALTER TABLE public.attendee_registrations
  ADD CONSTRAINT attendee_registrations_status_check
  CHECK (status IN ('pending', 'pago'));

ALTER TABLE public.sponsor_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_confirmation text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.sponsor_registrations
  DROP CONSTRAINT IF EXISTS sponsor_registrations_status_check;

ALTER TABLE public.sponsor_registrations
  ADD CONSTRAINT sponsor_registrations_status_check
  CHECK (status IN ('pending', 'pago'));

DROP POLICY IF EXISTS "attendee_registrations_update_admin" ON public.attendee_registrations;
CREATE POLICY "attendee_registrations_update_admin"
  ON public.attendee_registrations
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

DROP POLICY IF EXISTS "sponsor_registrations_update_admin" ON public.sponsor_registrations;
CREATE POLICY "sponsor_registrations_update_admin"
  ON public.sponsor_registrations
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

GRANT UPDATE ON public.attendee_registrations TO authenticated;
GRANT UPDATE ON public.sponsor_registrations TO authenticated;
