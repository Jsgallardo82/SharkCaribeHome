-- ============================================================
-- Shark Caribe 2026 · Actualizar enum sponsor_plan
-- Añade: emprendedor, bronce (planes separados)
-- Ejecutar en el SQL Editor de Supabase.
--
-- Nota: Postgres no permite quitar valores de un enum fácilmente.
-- Los valores antiguos (emprendedor_bronce, elite, muestra_comercial,
-- aliado_institucional) permanecen en el tipo por compatibilidad
-- con filas existentes, pero el formulario ya no los ofrece.
-- ============================================================

ALTER TYPE public.sponsor_plan ADD VALUE IF NOT EXISTS 'emprendedor';
ALTER TYPE public.sponsor_plan ADD VALUE IF NOT EXISTS 'bronce';
