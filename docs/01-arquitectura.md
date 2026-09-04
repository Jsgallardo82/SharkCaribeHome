# 01 · Arquitectura

## Stack

```mermaid
flowchart TB
  subgraph Cliente
    Browser[Navegador]
  end

  subgraph Vercel
    SPA[SPA React + Vite]
  end

  subgraph Supabase
    Auth[Auth]
    DB[(Postgres)]
    RPC[RPC SQL]
    EF[Edge Functions]
    Storage[Storage logos]
  end

  subgraph Externos
    Wompi[Wompi Checkout]
    Resend[Resend Email]
    IG[Instagram Embed]
    QRAPI[api.qrserver.com]
  end

  Browser --> SPA
  SPA --> Auth
  SPA --> DB
  SPA --> RPC
  SPA --> EF
  SPA --> Storage
  SPA -->|redirect form POST| Wompi
  Wompi -->|webhook transaction.updated| EF
  EF --> DB
  EF --> Resend
  Resend -->|HTML con img QR| Browser
  SPA --> IG
  Resend --> QRAPI
```

| Capa | Tecnología | Dónde |
|------|------------|--------|
| Frontend | React 18, Vite 6, React Router 7 | `src/` · deploy Vercel |
| Estilos | CSS modules por componente + tokens | `src/styles/`, `*.css` |
| Datos estáticos CMS | JS export | `src/data/content.js` |
| BaaS | Supabase Auth / DB / Storage / Functions | `supabase/` |
| Pagos | Wompi Web Checkout | `src/lib/wompi.js` + RPC |
| Email | Resend | Edge `wompi-webhook`, `resend-ticket`, `notify-registration` |

## Capas del frontend

```mermaid
flowchart LR
  main[main.jsx rutas] --> App[App landing]
  main --> Admin
  main --> Jury
  main --> Login
  main --> PaymentResult

  App --> Sections[Secciones UI]
  App --> URM[UnifiedRegisterModal]
  URM --> libSB[supabase.js]
  URM --> libW[wompi.js]
  Admin --> libSB
  Admin --> CheckIn[AdminCheckIn]
  Admin --> Preview[AdminTicketPreview]
  Preview --> TicketTpl[attendeeTicketEmail.js]
```

## Rutas

| Ruta | Rol |
|------|-----|
| `/`, `/boleta`, `/boleta/:seatType` | Landing + deep link compra |
| `/pago/resultado` | Retorno Wompi |
| `/login`, `/registro` | Auth |
| `/admin` | Admin |
| `/jurado` | Jurado |
| `/resultados-vivo` | Redirect a `/` (desactivado) |

## Flujo de alto nivel: compra de boleta

```mermaid
sequenceDiagram
  actor U as Comprador
  participant SPA as Front Vercel
  participant RPC as Supabase RPC
  participant DB as Postgres
  participant W as Wompi
  participant WH as wompi-webhook
  participant R as Resend

  U->>SPA: Completa UnifiedRegisterModal
  SPA->>RPC: create_event_wompi_checkout
  RPC->>DB: INSERT pending + reference
  RPC-->>SPA: publicKey, reference, signature, amount
  SPA->>W: POST checkout.wompi.co
  U->>W: Paga
  W->>WH: transaction.updated APPROVED
  WH->>DB: status=pago + ticket_number
  WH->>R: email HTML + QR
  R-->>U: Correo con ticket
  W-->>SPA: redirect /pago/resultado
```

## Entornos y secretos

**Front (`VITE_*`):** URL/anon Supabase, public key Wompi.  
**Edge / Dashboard:** `WOMPI_EVENTS_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `PUBLIC_SITE_URL`, service role.  
**Postgres privado:** secrets integrity Wompi (RPC checkout).

## Hosting

- Front: Vercel (`vercel.json` rewrite SPA).
- Backend: proyecto Supabase (functions + SQL Editor manual, no migraciones CLI obligatorias).
