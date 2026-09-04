# 04 · Wompi y Resend

Estas integraciones **no son componentes visuales**: viven en `src/lib`, RPC SQL y Edge Functions. Los componentes solo las disparan.

## Quién usa qué

| Pieza | Capa | Archivo / Function |
|-------|------|--------------------|
| Crear checkout firmado | RPC Postgres | `create_event_wompi_checkout` |
| Abrir checkout en browser | Front lib | `src/lib/wompi.js` → `redirectToWompiCheckout` |
| Disparo UI compra | Componente | `UnifiedRegisterModal.jsx` |
| Resultado en pantalla | Componente | `PaymentResult.jsx` |
| Confirmación de pago | Edge | `wompi-webhook` |
| Envío ticket al pagar | Edge + Resend | `wompi-webhook` → API Resend |
| Reenvío ticket | Edge + Resend | `resend-ticket` |
| Botón reenviar | Componente | `Admin.jsx` → `resendAttendeeTicket` |
| Aviso inscripción | Edge + Resend | `notify-registration` |

## Flujo Wompi (compra)

```mermaid
sequenceDiagram
  participant Modal as UnifiedRegisterModal
  participant SB as supabase.js
  participant RPC as create_event_wompi_checkout
  participant DB as attendee_registrations
  participant WLib as wompi.js
  participant Wompi as checkout.wompi.co
  participant WH as wompi-webhook
  participant Resend as api.resend.com

  Modal->>SB: createEventWompiCheckout(kind, values)
  SB->>RPC: rpc(...)
  RPC->>DB: INSERT status=pending<br/>payment_reference, amount_in_cents
  RPC-->>SB: publicKey, reference,<br/>signatureIntegrity, amountInCents, redirectUrl
  SB-->>Modal: checkout
  Modal->>WLib: redirectToWompiCheckout(checkout)
  WLib->>Wompi: form POST /p/
  Note over Wompi: Usuario paga
  Wompi->>WH: POST event transaction.updated
  WH->>WH: verifyEventChecksum
  alt status APPROVED
    WH->>DB: UPDATE status=pago<br/>wompi_transaction_id
    Note over DB: trigger → ticket_number
    WH->>DB: SELECT ticket_token
    WH->>Resend: POST /emails HTML ticket
  end
  Wompi-->>Modal: redirect /pago/resultado
```

### Montos típicos asistentes (centavos COP)

| Tipo | amount_in_cents | Precio UI |
|------|-----------------|-----------|
| Preferencial | `7990000` | COP $79.900 |
| General | `5000000` | COP $50.000 |

(Definidos en RPC / content; pruebas pueden usar RPC de $1.000.)

### Secrets Wompi

- Front: `VITE_WOMPI_PUBLIC_KEY`
- Edge webhook: `WOMPI_EVENTS_SECRET` (firma eventos)
- DB privada: integrity secret para firmar checkout (RPC)

## Flujo Resend (correo ticket)

```mermaid
flowchart TB
  A[Pago APPROVED<br/>wompi-webhook] --> B[buildAttendeeTicketEmail]
  C[Admin: Reenviar ticket] --> D[Edge resend-ticket]
  E[SQL test pg_net<br/>service_role] --> D
  D --> B
  B --> F[HTML Preferencial u General]
  F --> G[QR: sharkcaribe-ticket:UUID<br/>vía api.qrserver.com]
  G --> H[Resend API]
  H --> I[Inbox comprador]
```

### Plantilla del ticket

| Capa | Archivo |
|------|---------|
| Fuente de verdad (front) | `src/lib/attendeeTicketEmail.js` |
| Shared Edge | `supabase/functions/_shared/attendeeTicketEmail.ts` |
| Inline webhook / resend | Marcadores `/* ===== plantilla ticket ===== */` |
| Sync | `node scripts/sync-ticket-plantilla.mjs` |

Tras cambiar diseño: sync + **redesplegar** `wompi-webhook` y `resend-ticket`.

### Secrets Resend

- `RESEND_API_KEY`
- `RESEND_FROM` (ej. `Shark Caribe <noreply@sharkcaribe.co>`)
- `PUBLIC_SITE_URL` (base de logos/Sharky en el HTML)

### Pruebas SQL

- `supabase/test_ticket_to_juan.sql`
- `supabase/test_ticket_resend.sql`

## Check-in (después del correo)

```mermaid
flowchart LR
  QR[QR del correo] --> Cam[AdminCheckIn cámara]
  Cam --> Parse[extractTicketToken]
  Parse --> RPC[check_in_attendee_by_token]
  RPC --> OK{status pago?}
  OK -->|sí| IN[checked_in_at]
  OK -->|no| ERR[not_paid / not_found]
```

El token manual en Admin usa el mismo parser/RPC.
