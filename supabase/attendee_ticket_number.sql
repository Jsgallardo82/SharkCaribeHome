-- ============================================================
-- Numeración de tickets de asistentes (1, 2, 3…)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================
-- El número se asigna SOLO cuando status pasa a 'pago'
-- (pago Wompi, Admin o UPDATE manual). Así no se gastan
-- números si alguien abandona el checkout.
-- ============================================================

-- 1) Secuencia desde 1
CREATE SEQUENCE IF NOT EXISTS public.attendee_ticket_number_seq
  AS integer
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1;

-- 2) Columna en asistentes
ALTER TABLE public.attendee_registrations
  ADD COLUMN IF NOT EXISTS ticket_number integer;

COMMENT ON COLUMN public.attendee_registrations.ticket_number IS
  'Número de boleto (1…n). Se asigna al confirmar pago.';

-- 3) Único (solo filas con número)
CREATE UNIQUE INDEX IF NOT EXISTS attendee_registrations_ticket_number_uidx
  ON public.attendee_registrations (ticket_number)
  WHERE ticket_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS attendee_registrations_ticket_number_idx
  ON public.attendee_registrations (ticket_number)
  WHERE ticket_number IS NOT NULL;

-- 4) Trigger: al pasar a pago, asignar nextval si aún no tiene número
CREATE OR REPLACE FUNCTION public.attendee_assign_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM 'pago'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'pago')
     AND NEW.ticket_number IS NULL
  THEN
    NEW.ticket_number := nextval('public.attendee_ticket_number_seq')::integer;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendee_assign_ticket_number
  ON public.attendee_registrations;

CREATE TRIGGER trg_attendee_assign_ticket_number
  BEFORE INSERT OR UPDATE OF status, ticket_number
  ON public.attendee_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.attendee_assign_ticket_number();

-- 5) (Opcional) Backfill: numerar asistentes que YA están status = pago
--    y aún no tienen ticket_number. Descomenta si lo necesitas.
-- WITH ordered AS (
--   SELECT id
--   FROM public.attendee_registrations
--   WHERE status = 'pago' AND ticket_number IS NULL
--   ORDER BY reviewed_at NULLS LAST, created_at ASC
-- )
-- UPDATE public.attendee_registrations a
-- SET ticket_number = nextval('public.attendee_ticket_number_seq')::integer
-- FROM ordered o
-- WHERE a.id = o.id;

-- Verificar:
-- SELECT id, email, status, ticket_number
-- FROM public.attendee_registrations
-- ORDER BY ticket_number NULLS LAST, created_at DESC
-- LIMIT 20;
