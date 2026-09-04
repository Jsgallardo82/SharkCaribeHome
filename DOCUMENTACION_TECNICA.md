# Documentación técnica — Shark Caribe Home

**Proyecto:** Shark Caribe Pitch Competition 2026  
**Primer commit:** `3872fd4` (22 jul 2026)  
**Actualización:** 4 sep 2026  

La documentación detallada está separada por temas (con diagramas Mermaid):

## Índice → carpeta [`docs/`](./docs/README.md)

| Doc | Contenido |
|-----|-----------|
| [Arquitectura](./docs/01-arquitectura.md) | Stack, capas, diagrama de sistema, flujo compra |
| [Componentes](./docs/02-componentes.md) | Activos / legacy / huérfanos + dónde vive Wompi-Resend en UI |
| [Supabase](./docs/03-supabase.md) | Tablas, RPC, Edge Functions, roles |
| [Wompi y Resend](./docs/04-wompi-resend.md) | Checkout, webhook, correos ticket, secrets |
| [Boletas físicas y PDF](./docs/05-boletas-fisicas-pdf.md) | Inventario SQL + impresión 32×47 cm |

## Resumen rápido

- **Front:** React + Vite en Vercel (`sharkcaribe.co`)
- **Backend:** Supabase (Auth, Postgres, Storage, Edge)
- **Pagos:** Wompi (RPC checkout + Edge webhook) — disparado desde `UnifiedRegisterModal`
- **Email tickets:** Resend vía `wompi-webhook` / `resend-ticket` — botón Admin “Reenviar ticket”
- **PDF físicos:** `AdminTicketPreview` sobre filas `FISICO:INVENTARIO`

Para el inventario histórico de componentes y línea de tiempo completa, ver también las secciones antiguas consolidadas en `docs/02-componentes.md` y el historial git del repo.
