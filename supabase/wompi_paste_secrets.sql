-- ============================================================
-- Shark Caribe · Pegar secretos Wompi (integridad)
-- Ejecutar en SQL Editor de Supabase DESPUÉS de
-- wompi_attendee_payment.sql y wompi_checkout_rpc.sql
-- (o al menos crea private.wompi_secrets).
--
-- 1) Copia tu "Secreto de integridad" de Wompi
-- 2) Reemplaza PEGAR_AQUI_test_integrity_XXXXXXXX
-- 3) Run
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.wompi_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.wompi_secrets FROM PUBLIC, anon, authenticated;

INSERT INTO private.wompi_secrets (key, value)
VALUES ('integrity_secret', 'PEGAR_AQUI_test_integrity_XXXXXXXX')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

-- Verificación (no muestra el valor completo en clientes normales):
SELECT key, left(value, 18) || '…' AS value_preview, updated_at
FROM private.wompi_secrets
WHERE key = 'integrity_secret';
