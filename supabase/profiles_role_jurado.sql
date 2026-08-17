-- ============================================================
-- Shark Caribe 2026 · Agregar rol de cuenta: jurado
-- Ejecutar en el SQL Editor de Supabase.
--
-- Roles actuales observados en profiles.role:
--   admin | patrocinador | asistente | concursante
-- Este script AGREGA: jurado
-- (sin quitar los que ya existen)
-- ============================================================

/* ------------------------------------------------------------
   0) Diagnóstico rápido (opcional): ver valores actuales
   SELECT DISTINCT role FROM public.profiles ORDER BY 1;
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   Caso A: role es TEXT con CHECK constraint
   ------------------------------------------------------------ */
DO $$
DECLARE
  cons_name text;
  cons_def  text;
BEGIN
  SELECT c.conname, pg_get_constraintdef(c.oid)
    INTO cons_name, cons_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'profiles'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LIMIT 1;

  IF cons_name IS NOT NULL THEN
    IF cons_def ILIKE '%jurado%' THEN
      RAISE NOTICE 'El CHECK % ya permite jurado.', cons_name;
    ELSE
      EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cons_name);
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_role_check
        CHECK (
          role IN (
            'admin',
            'patrocinador',
            'asistente',
            'concursante',
            'jurado'
          )
        );
      RAISE NOTICE 'CHECK % actualizado: incluye jurado y conserva los roles previos.', cons_name;
    END IF;
  ELSE
    RAISE NOTICE 'No se encontró CHECK de role en profiles (puede ser enum o texto libre).';
  END IF;
END $$;

/* ------------------------------------------------------------
   Caso B: role es un ENUM de Postgres
   ------------------------------------------------------------ */
DO $$
DECLARE
  enum_type text;
BEGIN
  SELECT t.typname
    INTO enum_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
    AND a.attname = 'role'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND t.typtype = 'e'
  LIMIT 1;

  IF enum_type IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = enum_type
        AND e.enumlabel = 'jurado'
    ) THEN
      RAISE NOTICE 'El enum % ya incluye jurado.', enum_type;
    ELSE
      EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', enum_type, 'jurado');
      RAISE NOTICE 'Valor jurado agregado al enum %.', enum_type;
    END IF;
  ELSE
    RAISE NOTICE 'profiles.role no es un enum.';
  END IF;
EXCEPTION
  WHEN syntax_error THEN
    /* Postgres viejo sin IF NOT EXISTS en ADD VALUE */
    BEGIN
      EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type, 'jurado');
      RAISE NOTICE 'Valor jurado agregado al enum % (sin IF NOT EXISTS).', enum_type;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'jurado ya existía en el enum.';
    END;
END $$;

COMMENT ON COLUMN public.profiles.role IS
  'Rol de cuenta: admin | patrocinador | asistente | concursante | jurado';

/* ------------------------------------------------------------
   Verificar:
   SELECT unnest(enum_range(NULL::public.<nombre_enum>)) AS role;
   -- o, si es CHECK:
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'public.profiles'::regclass AND contype = 'c';

   Asignar a un usuario (después de crearlo en Authentication):

UPDATE public.profiles
SET role = 'jurado'
WHERE email = 'jurado@ejemplo.com';
   ------------------------------------------------------------ */
