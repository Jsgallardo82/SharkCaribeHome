# 03 · Supabase

## Piezas

```mermaid
flowchart LR
  subgraph DB
    T1[attendee_registrations]
    T2[sponsor_registrations]
    T3[exhibitor_registrations]
    T4[competitor_registrations]
    T5[profiles]
    T6[jury_scores_round2]
  end

  subgraph RPC
    C1[create_event_wompi_checkout]
    C2[check_in_attendee_by_token]
    C3[set_attendee_checked_in]
  end

  subgraph Edge
    E1[wompi-webhook]
    E2[resend-ticket]
    E3[notify-registration]
    E4[create-wompi-checkout legacy]
  end

  Front --> RPC
  Front --> Edge
  Edge --> DB
  RPC --> DB
  Wompi --> E1
```

## Tablas principales (asistentes / pagos)

| Tabla | Uso |
|-------|-----|
| `attendee_registrations` | Boletas: datos, `seat_type`, `status`, Wompi, `ticket_number`, `ticket_token`, `checked_in_at` |
| `sponsor_registrations` | Patrocinadores |
| `exhibitor_registrations` | Stands |
| `competitor_registrations` | Concursantes / etapas / logos |
| `profiles` | Roles `admin` / `jurado` |
| `jury_scores_round2` | Calificaciones 2ª ronda |

## Triggers / columnas clave boleta

- Al pasar a `status = 'pago'` → trigger asigna `ticket_number` (`attendee_ticket_number.sql`).
- `ticket_token` UUID único para QR (`attendee_checkin.sql`).
- Inventario físico marcado con `payment_confirmation = 'FISICO:INVENTARIO'`.

## Edge Functions

| Function | Quién la llama | Qué hace |
|----------|----------------|----------|
| `wompi-webhook` | Wompi | Valida firma, marca pago, envía Resend |
| `resend-ticket` | Admin / SQL service_role | Reenvía HTML ticket |
| `notify-registration` | Front tras insert | Avisos email inscripción |
| `create-wompi-checkout` | Legacy | Sustituido en flujo actual por RPC |

## Scripts SQL (carpeta `supabase/`)

Ejecución **manual** en SQL Editor. Ver lista completa en el resumen raíz; los críticos de boletas:

1. `attendee_sponsor_registrations.sql`
2. `wompi_*` + `create_event_wompi_checkout.sql`
3. `attendee_ticket_number.sql`
4. `attendee_checkin.sql`
5. `physical_ticket_inventory.sql`

## Roles

```mermaid
flowchart TB
  User[Usuario Auth] --> Profile{profiles.role}
  Profile -->|admin| AdminUI[/admin]
  Profile -->|jurado| JuryUI[/jurado]
  Profile -->|otro| Public[Landing pública]
```
