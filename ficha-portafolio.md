# Nombre del proyecto

Shark Caribe · Pitch Competition 2026.

Así aparece en el `<title>` de `index.html`. La documentación lo llama también Shark Caribe Home y Shark Caribe Pitch Competition 2026. La carpeta y el paquete npm se llaman `sharkcaribe-home`.

# Título de la ficha

Cobrar varias boletas en un pago y marcar, en la puerta, cuál QR ya entró.

# Qué problema resuelve

El sitio es la página de la IV Shark Caribe Pitch Competition. La gran final está fechada el 25 de noviembre de 2026, en el Hotel Dann Carlton, Barranquilla. El texto de `src/data/content.js` describe un concurso de pitch para emprendedores en etapa de escalabilidad, con postulación, aceleración y competencia final.

Quién encargó el desarrollo, y qué hacía esa persona antes de este sitio, no está en el repo.

La pregunta que el código sí responde es esta: alguien elige Preferencial o General, paga con Wompi, recibe un correo con un QR por boleta, y en el evento un administrador escanea ese QR para dejar constancia de ingreso. Un jurado con cuenta califica la segunda ronda. Patrocinadores y expositores también pasan por el mismo modal de pago.

# Cómo se usa

Quien abre el sitio no necesita cuenta. Ve, en este orden, la barra, el carrusel, “qué es”, aliados, semifinalistas, jurados, planes de patrocinio, muestra comercial, premios, prensa, Instagram, galería, otra vez aliados y el pie. Hay una decoración de Halloween que el código enciende y apaga sola entre el 24 de octubre de 2026 y las 06:00 del 1 de noviembre de 2026 (hora de Colombia).

Desde el menú, el carrusel o un enlace (`/boleta`, `/boleta/preferencial`, `/boleta/general`, o `?tipo=`) se abre un modal. Las categorías son público preferencial, público general, patrocinador, expositor de muestra comercial y competidor.

Si elige competidor, el modal muestra “Convocatoria cerrada” y no cobra. La fecha de cierre guardada es el 11 de agosto de 2026 a las 00:00, hora de Colombia. El insert de competidores en `src/lib/supabase.js` rechaza la fila después de esa hora. El componente `Competition`, que sí miraba si la convocatoria seguía abierta, está comentado en `App.jsx` y no se monta.

Si elige boleta, indica cuántas (tope 10), completa sus datos y, si compra más de una, el nombre de cada acompañante. El correo del acompañante es opcional: si va vacío, todas las boletas llegan al comprador. El botón abre el checkout de Wompi. Al volver, la ruta es `/pago/resultado`. Si Wompi avisa `APPROVED`, la fila pasa a `pago`, un trigger asigna `ticket_number` y Resend envía el HTML con el QR.

Patrocinador y expositor usan el mismo botón de pago. El texto de esos formularios dice que el equipo comercial contactará para cerrar el plan o el stand. El código, además, llama al checkout de Wompi (`create_event_wompi_checkout`). La compra de varias boletas de asistente usa otra función, `create_ticket_purchase`.

Las cuentas no hacen falta para comprar. Hacen falta para operar.

Roles en `profiles.role`: `admin`, `patrocinador`, `asistente`, `concursante`, `jurado`.

- `/login` pide correo y contraseña. `admin` entra a `/admin`. `jurado` entra a `/jurado`. Cualquier otro rol vuelve a `/`.
- El comentario de `src/lib/supabase.js` dice que los usuarios de administración se crean en el panel de Supabase y que no hay registro público de administradores. Aun así existe la ruta `/registro`. Si el alta de Supabase está cerrada, el mensaje pide acceso a un administrador. El rol por defecto al crear perfil, según ese mismo archivo, es `concursante`.
- `/admin` exige rol `admin`. Pestañas: Acceso (cámara o token de QR), Boleta (vista e inventario físico para imprenta), Competidores, Asistentes, Patrocinadores, Expositores y Resultados de la 2ª ronda. Desde ahí se confirma un pago a mano, se reenvía el ticket, se marca ingreso y se descarga Excel.
- `/jurado` exige rol `jurado`. Califica cinco criterios, cada uno de 1 a 5. El total se calcula solo, sobre 25.
- `/resultados-vivo`, en el último commit, redirige a `/`. En el archivo local, sin commit, esa ruta muestra el ranking solo con `npm run dev`.

# Qué se construyó

Stack que sí está en el repo:

- Front: React 18, Vite 6, React Router 7, CSS por componente. Despliegue descrito como Vercel. `vercel.json` reescribe toda ruta a `index.html`. Analytics de Vercel está importado en `src/main.jsx`.
- Datos y auth: Supabase (Auth, Postgres, Storage, Edge Functions, RPC). Los SQL se pegan a mano en el SQL Editor. La documentación dice que no hay migraciones CLI obligatorias.
- Pagos: Wompi Web Checkout, desde `src/lib/wompi.js` y RPC.
- Correo: Resend, desde las funciones `wompi-webhook`, `resend-ticket` y `notify-registration`.
- QR de lectura en el admin: `html5-qrcode`. El QR del correo sale por `api.qrserver.com`.
- Export del admin: `xlsx`.
- Textos de la página: `src/data/content.js`. Instagram entra como embed.

Qué quedó de lado, con el archivo que lo muestra:

- La función Edge `create-wompi-checkout` está marcada como legacy. El flujo actual de asistentes es la RPC `create_ticket_purchase`. Patrocinadores y expositores siguen en `create_event_wompi_checkout`. Evidencia: `docs/03-supabase.md` y `src/lib/supabase.js`.
- En `App.jsx` están comentados y no se montan: `Competition`, `Ventures`, `PitchRound`, `Editions`, `Entradas`, `Testimonials`, `Contact`.
- Sin imports, según `docs/02-componentes.md`: `AttendeeModal`, `SponsorModal`, `ExhibitorModal`, `ClosedCompetitorModal`, `LiveRound2Results`. `RegisterModal` no se monta; su CSS sí lo usa el modal unificado.
- `supabase/multi_ticket_purchase.sql` quita los UNIQUE de correo y de documento, y el índice único de `payment_reference`. El comentario dice para qué: una segunda boleta con los mismos datos no cabía, y un pago rechazado dejaba la fila `pending` y bloqueaba el reintento.
- `supabase/wompi_fix_amount_1000.sql` fija un cobro de prueba de COP $1.000 y pide volver a correr `wompi_checkout_rpc.sql` para los montos normales.
- El ranking público `/resultados-vivo` queda redirigido en el commit. La documentación de rutas lo da por desactivado.
- `Contact.jsx` tiene un TODO de conectar el formulario a un servicio de correo, y el componente no está montado.
- Los testimonios del archivo son el texto “Nombre Apellido”. No son personas del repo.
- Hay etiquetas de planes marcadas como legado, para filas viejas del admin: `src/data/content.js`, `SPONSOR_PLAN_LABELS`.

El reto que el repo documenta con más detalle es la compra de varias boletas en un solo pago.

Evidencia: `supabase/multi_ticket_purchase.sql` (comentario del 21 de octubre de 2026 en el commit `97744f9`, mensaje “compra de varias boletas en un solo pago”) y `docs/04-wompi-resend.md`.

El script dice tres cosas concretas. Primero: el UNIQUE de correo y el de documento impedían comprar más de una boleta con los mismos datos, y también reintentar tras un pago rechazado. Segundo: la referencia de Wompi pasa a ser compartida por las N filas de una compra, así que deja de ser única por fila. Tercero: hay que desplegar la Edge Function `wompi-webhook` antes de ejecutar ese SQL. Al revés, una compra múltiple se cobra y no se puede confirmar. Patrocinadores y expositores no entran en ese cambio.

Al lado de eso, la plantilla del ticket está copiada en cuatro sitios. `docs/04-wompi-resend.md` nombra la fuente en `src/lib/attendeeTicketEmail.js`, la copia de las Edge Functions y el script `scripts/sync-ticket-plantilla.mjs`. El commit `67ff763` (21 oct 2026) dice “tickets: sincroniza aliados en las 4 copias de la plantilla”. Si se cambia el diseño y no se redespliegan `wompi-webhook` y `resend-ticket`, el correo sale con la plantilla vieja.

Otro límite escrito en el código: los términos de referencia, según el comentario de `src/data/content.js`, dejan sin categoría a quien tiene entre 46 y 49 años (Prime 18-45, Silver de 50 en adelante). El formulario y el trigger usan Prime hasta 49 para coincidir con la base.

# Números

Precios escritos en `src/data/content.js` y en `docs/04-wompi-resend.md`:

- Boleta Preferencial: COP $79.900 (`7990000` centavos).
- Boleta General: COP $50.000 (`5000000` centavos).
- Tope por compra: 10 boletas (`MAX_TICKETS_PER_PURCHASE`).
- Derechos de inscripción de competidor: COP $15.000. Hay una llave de pago en ese formulario. No la copio.
- Planes de patrocinio, más retenciones: COP $3.500.000, $6.900.000, $11.990.000, $25.000.000 y $35.000.000.
- Stands: COP $2.500.000 (2,0 × 2,0 m) y COP $1.500.000 (2,0 × 1,6 m).
- Premios en efectivo de la gran final: $5 M, $2 M y $1 M.
- Cobro de prueba en `supabase/wompi_fix_amount_1000.sql`: COP $1.000.

Inventario físico, en `docs/05-boletas-fisicas-pdf.md`: 100 Preferencial y 100 General, hoja de 32 × 47 cm. El mismo documento dice que esas filas cuentan como pagadas y que no hay tope automático frente a la venta en línea.

Fechas de corte en el código:

- Cierre de inscripción de competidores: 11 de agosto de 2026, 00:00, hora de Colombia.
- Revelado del ranking en vivo: 18 de agosto de 2026, 08:30, hora de Colombia.
- Halloween: del 24 de octubre de 2026 a las 06:00 del 1 de noviembre de 2026, hora de Colombia.
- Gran final en los textos: 25 de noviembre de 2026.
- Ediciones nombradas en la página: 2022, 2023, 2024 y 2026 (cuarta). No hay una edición 2025 en ese bloque.
- Primer commit: 22 de julio de 2026.
- La documentación técnica dice “Actualización: 4 sep 2026”. Git tiene commits después de esa fecha.
- Historial: 58 commits, del 22 de julio de 2026 al 29 de octubre de 2026.

Calificación del jurado: 5 criterios, de 1 a 5, total sobre 25. Pitch pedido en el formulario de competidores: 3 a 5 minutos. Categorías de edad en el formulario: Junior 10 a 17, Prime 18 a 49, Silver 50 o más.

La muestra comercial dice “frente a más de 300 asistentes”. Es una frase del texto, no un conteo de filas.

Usuarios, boletas vendidas, registros reales y métricas de analytics: No está en el repo.

# Línea de tiempo

Todos los commits tienen el mismo nombre de autor en git: `unknown`. Hay un solo correo de autor. No lo copio. En git parece trabajo de una sola persona. Si hubo más gente fuera de git, no está en el repo.

- 22 jul 2026. Commit `3872fd4`, “primera vista del homepage de sharkcaribe”. Autor: unknown. Una persona en git.
- 26 jul 2026. Commit `c6439c0`, “añadiendo supabase y estilos”. Autor: unknown. Una persona en git.
- 5 ago 2026. Commit `6356dc6`, “nuevo formulario, nuevos planes”. Autor: unknown. Una persona en git.
- 10 ago 2026. Commit `1a2eafa`, “cierre a las 12”. La constante de cierre de competidores queda en la medianoche del 11 de agosto, hora de Colombia. Autor: unknown. Una persona en git.
- 14 ago 2026. Commit `2d5e661`, “actualizacion de premos y 2 ronda”. Autor: unknown. Una persona en git.
- 17 ago 2026. Commits del panel de jurado, el ranking en vivo y la cuenta regresiva (`8d6ba67`, `e4d100a`, `2124dbe`). Autor: unknown. Una persona en git.
- 28 ago 2026. Commit `d9695b6`, “sistema de resend”. Autor: unknown. Una persona en git.
- 2 sep 2026. Commits de boletas físicas (`106e4f4`, “tickets fisicos”) y de lectura de QR (`b7bcaa9`, “cambios qr lectur”), más cambios de hora. Autor: unknown. Una persona en git.
- 4 sep 2026. Fecha escrita en `DOCUMENTACION_TECNICA.md` como actualización de la documentación. Ese mismo día hay un commit, `c339420`, “eliminar jurado”. Autor: unknown. Una persona en git.
- 9 sep 2026. Último commit de ese tramo, `9c59ac6`, “cambio texto jurado”. Autor: unknown. Una persona en git.
- Del 10 sep 2026 al 20 oct 2026 no hay commits. No completo ese hueco.
- 21 oct 2026. Commit `97744f9`, compra de varias boletas en un solo pago. El mismo día hay commits de aliados, logos de boleta y un redeploy en Vercel. Autor: unknown. Una persona en git.
- 29 oct 2026. Commit `ab32bd0`, “decoracion de halloween (temporal, se apaga sola el 1 de noviembre)”. Autor: unknown. Una persona en git.

Hay un cambio sin commit en `src/main.jsx`. No tiene fecha de autor. El commit deja `/resultados-vivo` redirigido siempre a `/`. El archivo en disco lo muestra solo en `npm run dev`.

# Imágenes

No hay capturas del panel de admin, del checkout de Wompi ni del portal del jurado.

Estas rutas sí existen y el código montado las usa. Van junto al párrafo indicado.

- `public/hero/hero0.jpg`. Alt en el código: “Shark Caribe 2026”. Junto al primer párrafo de “Cómo se usa”, el carrusel al abrir el sitio. En `public/hero/` también están `hero1.jpg` y `hero2.jpg`. El carrusel de `src/data/content.js` solo referencia `hero0.jpg`.
- `public/album/2023/Imagen9.jpg`. Fondo del hero en `src/components/Hero.jsx`. Mismo párrafo.
- `public/banner.jpeg`. Fondo de la sección de patrocinadores (`src/components/Sponsors.css`). Junto al párrafo de planes, en “Cómo se usa”.
- `public/stand.jpeg`. Imagen de la muestra comercial (`src/components/MuestraComercial.jsx`). Junto a ese mismo párrafo.
- `public/album/2022/Imagen1.jpg` a `Imagen5.jpg`, `public/album/2023/Imagen6.jpg` a `Imagen11.jpg`, `public/album/2024/Imagen12.jpg` a `Imagen16.jpg`. Galería, alts “Shark Caribe” más el año. Junto al párrafo de ediciones, en “Qué problema resuelve”.

En `public/` hay tres archivos de inscripción que el código montado no referencia: `Inscripción Competidores.jpg`, `inscripción asistentes.jpeg` y `banner inscripción patrocinadores y muestra comercial.jpeg`. `Contact.jsx` tiene un alt parecido al tercero, y ese componente no se monta. No describo qué se ve dentro, porque el repo no lo dice.

Hay logos y fotos de personas (jurados, concursantes, segunda ronda) en `public/logos/`, `public/jurados/`, `public/concursantes/` y `public/2ronda/`. Hay listas de personas en el código. No copio los nombres.

# Enlaces

Repositorio, en el remoto git: https://github.com/Jsgallardo82/SharkCaribeHome

Despliegue, en la documentación y en `src/data/content.js`: https://sharkcaribe.co

Si ese repositorio de GitHub es privado: No está en el repo. `package.json` tiene `"private": true`. Eso es la marca de npm para no publicar el paquete. No dice si el remoto es privado.

# Borrador

El sitio se presenta como Shark Caribe · Pitch Competition 2026. La gran final está escrita para el 25 de noviembre de 2026, en el Hotel Dann Carlton de Barranquilla. Quién pidió el trabajo, y con qué herramienta llevaba las boletas antes, [no está en el repo].

El primer commit es del 22 de julio de 2026. El mensaje es “primera vista del homepage de sharkcaribe”. El autor en git se llama unknown. Los 58 commits llevan ese mismo nombre.

La compra pública no pide cuenta. El modal crea la fila pendiente y abre Wompi. Si el pago queda APPROVED, el webhook marca `pago`, un trigger pone el número de boleta y Resend manda el correo con el QR. El comprador vuelve a `/pago/resultado`.

Comprar varias boletas chocó con dos UNIQUE, el de correo y el de documento. La fila `pending` de un pago rechazado también dejaba al comprador fuera. El script las quita y comparte una sola referencia de Wompi entre las boletas de esa compra. El comentario exige desplegar `wompi-webhook` antes del SQL. Al revés, el cobro queda y la compra múltiple no se confirma.

El inventario físico inserta 100 preferenciales y 100 generales ya en estado `pago`. El admin las imprime en una hoja de 32 por 47 cm, con un QR distinto por boleta. Esas filas cuentan como pagadas en los reportes. El QR responde aunque la boleta no se haya vendido en caja.

No hay en el repo cuántas boletas se vendieron ni cuántas personas entraron. [no está en el repo]. Tampoco hay una captura del admin, del checkout ni del jurado.

# Qué tiene que confirmar el autor

- Si trabajó solo. Git muestra un solo nombre de autor, `unknown`, y un solo correo, en los 58 commits. Eso no dice si hubo otra persona fuera de git.
- Con quién, si hubo alguien. No está en el repo.
- Si el usuario de la URL de GitHub es la misma persona que el autor `unknown` de los commits.
- El nombre con el que quiere firmar la ficha. En git no hay un nombre de persona.
- Si el cambio sin commit de `src/main.jsx` (ranking solo en local) entra en la ficha o se descarta.
- Si los SQL del repo se ejecutaron en el proyecto de Supabase de producción. El repo solo tiene los scripts y dice que se pegan a mano.
- Cuántas boletas se vendieron, cuántas personas se registraron y si la frase “más de 300 asistentes” es un dato o solo texto de la página.
- Si el repositorio de GitHub es público o privado.
- Si quiere una captura del admin, del checkout, del correo o del jurado. Esas capturas no están en el repo.
- Qué pasó entre el 10 de septiembre de 2026 y el 20 de octubre de 2026. En ese tramo no hay commits.
