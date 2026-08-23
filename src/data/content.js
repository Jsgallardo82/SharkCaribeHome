/* ============================================================
   CONTENIDO DEL SITIO
   Edita aquí los textos, ediciones, testimonios y galería.
   Las imágenes van en /src/assets y se importan, o se referencian
   desde /public. Por ahora se usan placeholders.
   ============================================================ */

/* Formulario anterior en Microsoft Forms. Ya no se usa: la inscripción vive
   en el modal del sitio (RegisterModal). Se conserva como respaldo. */
export const REGISTER_URL =
  'https://forms.office.com/pages/responsepage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAYAABGDyKtUNE1ZQ0k1ODhKNjFHMk1UTjhWRk0xSkpBUS4u&route=shorturl'

/* Redes sociales */
export const INSTAGRAM_URL =
  'https://www.instagram.com/shark.caribe?igsh=a3FiYWx0bTRsMWJv'

/* Feed Instagram · edición actual (URLs curadas; embeds oficiales) */
export const INSTAGRAM_FEED = {
  username: 'shark.caribe',
  profileUrl: 'https://www.instagram.com/shark.caribe/',
  eyebrow: 'Edición 2026',
  title: 'En Instagram',
  subtitle: 'Publicaciones oficiales de esta edición.',
  emptyMessage: 'Sigue la edición en vivo en nuestro Instagram.',
  moreCta: 'Ver más en Instagram',
  maxVisible: 12,
  posts: [
    {
      id: '1',
      post_url: 'https://www.instagram.com/p/Dbl7JrCO3xD/',
      display_order: 1,
    },
    {
      id: '2',
      post_url: 'https://www.instagram.com/reel/DboKrmCOJMK/',
      display_order: 2,
    },
    {
      id: '3',
      post_url: 'https://www.instagram.com/reel/DbuD5y1syGs/',
      display_order: 3,
    },
    {
      id: '4',
      post_url: 'https://www.instagram.com/reel/DbwmxKrMD9G/',
      display_order: 4,
    },
    {
      id: '5',
      post_url: 'https://www.instagram.com/reel/DbyrAUwhW81/',
      display_order: 5,
    },
    {
      id: '6',
      post_url: 'https://www.instagram.com/p/Db0-JUhuc2J/',
      display_order: 6,
    },
    {
      id: '7',
      post_url: 'https://www.instagram.com/p/Db3o7jGO0mh/',
      display_order: 7,
    },
    {
      id: '8',
      post_url: 'https://www.instagram.com/p/Db4uTbGtMzj/',
      display_order: 8,
    },
    {
      id: '9',
      post_url: 'https://www.instagram.com/p/Db9j5YuMUll/',
      display_order: 9,
    },
    {
      id: '10',
      post_url: 'https://www.instagram.com/reel/DcEZ_A2uzWo/',
      display_order: 10,
    },
    {
      id: '11',
      post_url: 'https://www.instagram.com/reel/DcNOCjrMSzX/',
      display_order: 11,
    },
    {
      id: '12',
      post_url: 'https://www.instagram.com/p/DbyIvbvjWay/',
      display_order: 12,
    },
  ],
}

/* Términos de referencia de la competencia (documento descargable en /public) */
export const TERMS_URL = '/terminos-referencia-shark-caribe-2026.pdf'

/* Carrusel del hero: imágenes a pantalla completa en /public/hero */
export const HERO_SLIDES = [
  {
    id: 'hero0',
    src: '/hero/hero0.jpg',
    alt: 'Shark Caribe 2026',
  },
  {
    id: 'hero1',
    src: '/hero/hero1.jpg',
    alt: 'Shark Caribe 2026',
  },
  {
    id: 'hero2',
    src: '/hero/hero2.jpg',
    alt: 'Shark Caribe 2026',
  },
]

/* Organizador. */
export const ORGANIZER = { name: 'IS Comunicaciones', logo: '/logos/iss.jpeg' }

/* Aliados estratégicos (logos en /public/logos). */
export const ALLIES = [
  { name: 'Universidad Sergio Arboleda', sub: 'Barranquilla', logo: '/logos/sergioarboleda.png' },
  { name: 'Prime Business School', sub: 'Universidad Sergio Arboleda', logo: '/logos/prime.png' },
  { name: 'SENA', sub: '', logo: '/logos/sena.png' },
  { name: 'Índice', sub: '', logo: '/logos/indice.png' },
  { name: 'FCA', sub: '', logo: '/logos/fca.png' },
  { name: 'Elena', sub: '', logo: '/logos/elena.jpeg' },
  { name: 'Mi Red', sub: '', logo: '/logos/mired.png' },
  { name: 'Space Rock', sub: '', logo: '/logos/spacerock.png' },
  { name: 'CC Buenavista', sub: '', logo: '/logos/ccbuenavista.png' },
  { name: 'Reformada', sub: '', logo: '/logos/reformada.png' },
  { name: 'Universidad del Atlántico', sub: 'Vigilada Mineducación', logo: '/logos/UA.png' },
]

/* Correo al que se envían los soportes de pago y la fotocopia del documento */
export const SUPPORT_EMAIL = 'eventos@shark.caribe.co'

/* Correo administrativo (avisos y convocatoria cerrada) */
export const ADMIN_EMAIL = 'administrativo@sharkcaribe.co'

/* Cierre de inscripción de competidores (medianoche Colombia).
   Debe coincidir con el trigger en supabase/competitor_registration_deadline.sql */
export const COMPETITOR_REGISTRATION_CLOSES_AT = '2026-08-11T00:00:00-05:00'

export function isCompetitorRegistrationOpen(now = new Date()) {
  return now.getTime() < new Date(COMPETITOR_REGISTRATION_CLOSES_AT).getTime()
}

export const COMPETITOR_REGISTRATION_CLOSED = {
  title: 'Convocatoria cerrada',
  message:
    'Las inscripciones para competidores de Shark Caribe 2026 ya no están disponibles.',
  contactHint: 'Si tienes dudas o un caso especial, escríbenos a',
  email: ADMIN_EMAIL,
  ctaLabel: 'Convocatoria cerrada',
}

/* ============================================================
   FORMULARIO DE INSCRIPCIÓN · COMPETIDORES
   Las opciones (value) deben coincidir EXACTAMENTE con los enums
   de la tabla competitor_registrations en Supabase.
   ============================================================ */

export const REGISTRATION = {
  title: 'Registro exclusivo para competidores',
  intro:
    'Diligencia el formulario con información clara y verificable. Solo recopilamos los datos que tú nos proporciones aquí.',
  feeLabel: 'Derechos de inscripción',
  feeAmount: 'COP $15.000',
  paymentKeyLabel: 'Llave',
  paymentKey: '0091352051',
  /* El pago va DESPUÉS de inscribirse, así que aquí solo se informa el costo.
     Las instrucciones para pagar viven en la pantalla de éxito del modal. */
  feeHint:
    'No pagues todavía: al terminar tu inscripción te explicamos cómo hacerlo y a dónde enviar los soportes.',
  terms: [
    'Contar con producto mínimo viable validado.',
    'Pertenecer a uno de los sectores definidos.',
    'Presentar un pitch de máximo 3 a 5 minutos.',
    'Haber recibido capital semilla.',
    'Entregar una ficha de caracterización: emprendimiento, problema que resuelve, cliente objetivo, propuesta de valor, ventas o validación, necesidades y proyección.',
    'Contar con evidencia visual: muestra física, fotos, catálogo, prototipo, video o demostración.',
    'En la categoría Junior, los postulados deben adjuntar carta de autorización firmada por los padres o adulto responsable.',
    'Aceptar que el negocio podrá ser divulgado con fines de promoción del evento.',
  ],
}

export const DOCUMENT_TYPES = [
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'passport', label: 'Pasaporte' },
]

/* OJO: los términos de referencia dicen Prime 18-45 y Silver +50, lo que deja
   sin categoría a quienes tienen entre 46 y 49 años. Aquí el rango de Prime
   llega a 49 para que coincida con lo que valida la base de datos.
   Si el organizador confirma otra cosa, se ajusta aquí y en el trigger. */
export const CATEGORIES = [
  { value: 'junior', label: 'Junior', range: '10 a 17 años', min: 10, max: 17 },
  { value: 'prime', label: 'Prime', range: '18 a 49 años', min: 18, max: 49 },
  { value: 'silver', label: 'Silver', range: '50 años o más', min: 50, max: 130 },
]

/* Roles de cuenta en public.profiles.role */
export const USER_ROLES = {
  admin: 'admin',
  patrocinador: 'patrocinador',
  asistente: 'asistente',
  concursante: 'concursante',
  jurado: 'jurado',
}

export const USER_ROLE_LABELS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'patrocinador', label: 'Patrocinador' },
  { value: 'asistente', label: 'Asistente' },
  { value: 'concursante', label: 'Concursante' },
  { value: 'jurado', label: 'Jurado' },
]

/* Portal del jurado */
export const JURY_PORTAL = {
  roleLabel: 'Jurado',
  competitionTitle: 'IV Shark Caribe Pitch Competition 2026',
}

/* Criterios de calificación · 2ª ronda (puntaje 1–5 c/u) */
export const JURY_ROUND2_CRITERIA = [
  {
    key: 'viabilidad_financiera',
    label: 'Viabilidad financiera',
    hint: 'Solidez del modelo de ingresos, sostenibilidad y proyecciones realistas.',
  },
  {
    key: 'estrategia_comercial',
    label: 'Estrategia comercial',
    hint: 'Claridad en la propuesta de ventas B2B/B2C, canales y métricas iniciales.',
  },
  {
    key: 'preparacion_inversion',
    label: 'Preparación para inversión',
    hint: 'Argumentos sólidos para levantar capital, escalabilidad y uso eficiente de recursos.',
  },
  {
    key: 'presencia_ejecutiva',
    label: 'Presencia ejecutiva',
    hint: 'Liderazgo, confianza y capacidad de transmitir visión empresarial.',
  },
  {
    key: 'innovacion_aplicada',
    label: 'Innovación aplicada',
    hint: 'Uso creativo de metodologías, tecnología o aprendizajes del bootcamp.',
  },
]

export const JURY_ROUND2_SCORE_MIN = 1
export const JURY_ROUND2_SCORE_MAX = 5

/* Ranking en vivo: visible desde esta hora (Colombia, UTC-5) */
export const LIVE_RANKING_REVEALS_AT = '2026-08-18T08:30:00-05:00'

export function isLiveRankingVisible(now = new Date()) {
  return now.getTime() >= new Date(LIVE_RANKING_REVEALS_AT).getTime()
}

export function getLiveRankingCountdown(now = new Date()) {
  const target = new Date(LIVE_RANKING_REVEALS_AT).getTime()
  const diff = Math.max(0, target - now.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { diff, totalSeconds, hours, minutes, seconds, done: diff <= 0 }
}

/* Orden fijo de pitch para el panel del jurado (2ª ronda).
   “Sistema de hidroponía” queda fuera del concurso. */
export const JURY_ROUND2_EXCLUDED = [/hidropo/i, /hidropon/i]

export const JURY_ROUND2_PITCH_ORDER = [
  /hey\s*eva|eva\s*native/i,
  /gastro|optimai?zer/i,
  /origen\s*quillero/i,
  /cv\s*card|cvcard|cvcar/i,
  /menu\s*be|menube/i,
  /ferrel\s*a|ferrela|ferreia/i,
  /ayuda\s*dom[eé]stica|\btad\b/i,
  /oportunitic/i,
  /nobaq/i,
  /legal/i,
  /\bmito\b/i,
  /sweet\s*liz|sweetliz/i,
  /artecano/i,
  /taller\s*(de\s*)?ingrid|accesorios\s*el\s*taller/i,
]

export function sortJuryRound2Competitors(list = []) {
  const filtered = list.filter((c) => {
    const name = String(c?.venture_name || '')
    return !JURY_ROUND2_EXCLUDED.some((rx) => rx.test(name))
  })

  const ranked = []
  const used = new Set()

  for (const match of JURY_ROUND2_PITCH_ORDER) {
    const hit = filtered.find(
      (c) => !used.has(c.id) && match.test(String(c.venture_name || ''))
    )
    if (hit) {
      ranked.push(hit)
      used.add(hit.id)
    }
  }

  for (const c of filtered) {
    if (!used.has(c.id)) ranked.push(c)
  }

  return ranked
}

export const CONTACT_METHODS = [
  { value: 'email', label: 'Correo electrónico' },
  { value: 'whatsapp', label: 'Celular / WhatsApp' },
]

export const SECTORS = [
  { value: 'base_tecnologica', label: 'Startups de base tecnológica' },
  { value: 'turismo', label: 'Turismo' },
  { value: 'textiles_confeccion', label: 'Textiles y confección' },
  { value: 'cuero_calzado', label: 'Cuero y calzado' },
  { value: 'ceramica_arcilla', label: 'Cerámica y arcilla' },
  { value: 'madera_construccion_ligera', label: 'Madera y construcción ligera' },
  { value: 'artes_plasticas', label: 'Artes plásticas' },
  { value: 'manualidades', label: 'Manualidades' },
  { value: 'oficios_rurales_sostenibles', label: 'Oficios rurales y sostenibles' },
]

export const REFERRAL_SOURCES = [
  { value: 'instagram', label: '@shark.caribe' },
  { value: 'sergio_arboleda', label: 'Universidad Sergio Arboleda' },
  {
    value: 'universidad_autonoma_del_caribe',
    label: 'Universidad Autónoma del Caribe',
  },
  { value: 'sena', label: 'SENA' },
  { value: 'recomendacion', label: 'Recomendación' },
  { value: 'other', label: 'Otro' },
]

/* ============================================================
   FORMULARIO · ASISTENTES
   Valores alineados con enums de attendee_registrations.
   ============================================================ */

export const ATTENDEE_REGISTRATION = {
  title: 'Registro de asistentes',
  intro:
    'Compra tu entrada y vive la experiencia Shark Caribe 2026 en el Hotel Dann Carlton. Completa tus datos para apartar tu cupo.',
  feeLabel: 'Valor de entrada',
  feeHint:
    'El valor depende de la ubicación elegida (preferencial o general). Al enviar el formulario te llevamos a pagar con Wompi.',
}

export const UNIFIED_REGISTER = {
  title: 'Inscripción Shark Caribe 2026',
  intro:
    'Elige tu categoría, completa tus datos y paga en línea con Wompi para confirmar tu cupo.',
  feeLabel: 'Valor a pagar',
  feeHint:
    'Al continuar se crea tu registro pendiente y se abre el checkout seguro de Wompi. El pago confirma tu inscripción automáticamente.',
}

/* Sección visual de entradas (asistentes) */
export const ENTRADAS = {
  eyebrow: 'Pitch Competition by Shark Caribe',
  titleBefore: 'Elige la ',
  titleHighlight: 'entrada',
  titleMid: ' ideal para ',
  titleHighlightEnd: 'ti',
  subtitle: 'Dos categorías, una experiencia inolvidable.',
  date: '25 de noviembre de 2026',
  location: 'Hotel Dann Carlton, Barranquilla',
  cta: 'Comprar',
  footerNote: 'Inscripciones abiertas',
}

export const ATTENDEE_DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'passport', label: 'Pasaporte' },
]

export const ATTENDEE_PROFILES = [
  { value: 'emprendedor', label: 'Emprendedor' },
  { value: 'inversionista', label: 'Inversionista / Business Angel' },
  { value: 'ejecutivo', label: 'Ejecutivo / Empresario' },
  { value: 'estudiante', label: 'Estudiante Académico' },
  { value: 'mentor', label: 'Mentor / Consultor' },
  { value: 'publico_general', label: 'Público General' },
  { value: 'delegacion_acompanante', label: 'Delegación acompañante' },
]

export const ATTENDEE_INTERESTS = [
  {
    value: 'networking',
    label: 'Conectar con emprendedores / Networking',
  },
  { value: 'inversion', label: 'Buscar oportunidades de inversión' },
  {
    value: 'tendencias',
    label: 'Conocer tendencias e innovación regional',
  },
  { value: 'aprender', label: 'Aprender / Inspiración' },
]

export const ATTENDEE_SEAT_TYPES = [
  {
    value: 'preferencial',
    label: 'Preferencial',
    price: '$79.900',
    priceLabel: 'COP $79.900',
    description: 'Acceso preferencial a una experiencia premium.',
    featured: true,
  },
  {
    value: 'general',
    label: 'General',
    price: '$50.000',
    priceLabel: 'COP $50.000',
    description: 'Acceso general al evento.',
    featured: false,
  },
]

/* ============================================================
   FORMULARIO · PATROCINADORES
   Valores alineados con enums de sponsor_registrations.
   ============================================================ */

export const SPONSOR_REGISTRATION = {
  title: 'Registro de patrocinadores',
  intro:
    'Vincula tu marca a Shark Caribe 2026. Completa el formulario y el equipo comercial te contactará para cerrar tu plan.',
}

/* Planes del formulario (alineados con enum sponsor_plan) */
export const SPONSOR_PLANS = [
  {
    value: 'emprendedor',
    label: 'Plan Emprendedor',
    audience:
      'Ideal para pequeñas empresas, emprendimientos y marcas emergentes.',
    benefits: [
      'Logo en el backing multilogo del evento.',
      'Presencia en la página oficial de Shark Caribe como aliado.',
      'Difusión en una (1) publicación en redes sociales.',
      '2 entradas VIP.',
      'Certificado como aliado estratégico.',
    ],
    priceLabel: 'COP $3.500.000 + retenciones',
  },
  {
    value: 'bronce',
    label: 'Plan Bronce',
    audience:
      'Ideal para empresas locales, PYMES y marcas que desean fortalecer su posicionamiento dentro del ecosistema emprendedor.',
    benefits: [
      'Reconocimiento como Aliado Oficial de la IV Shark Caribe Pitch Competition.',
      'Logo en el backing multilogo del evento.',
      'Presencia de marca en la página web de Shark Caribe.',
      'Mención en dos (2) publicaciones en redes sociales oficiales.',
      'Derecho a instalar un pendón o banner corporativo en la zona de networking.',
      '4 entradas VIP para el evento.',
      'Participación en los espacios de networking empresarial.',
      'Certificado de aporte.',
      'Placa de reconocimiento como aliado.',
    ],
    priceLabel: 'COP $6.900.000 + retenciones',
  },
  {
    value: 'silver',
    label: 'Plan Silver',
    audience:
      'Ideal para empresas que buscan mayor posicionamiento de marca y una relación más cercana con el ecosistema de innovación y emprendimiento.',
    benefits: [
      'Todos los beneficios del Plan Bronce.',
      'Espacio comercial de 2 × 2 m en la Galería Empresarial.',
      'Inclusión del logo en piezas oficiales (pantalla principal, invitación digital, backing multilogo, escarapelas y manillas).',
      'Publicidad durante un (1) mes en los canales digitales de Shark Caribe (sitio web y redes sociales).',
      'Mención protocolaria durante el evento como patrocinador Silver.',
      'Entrevista o cápsula de contenido para redes sociales de Shark Caribe.',
      'Inclusión de un artículo promocional o muestra de producto en el kit del participante.',
      '10 entradas VIP para el evento.',
      'Certificado de patrocinio y placa de reconocimiento.',
      'Difusión de una pieza audiovisual que resalte el compromiso del patrocinador (material finalizado a entregar por la marca).',
    ],
    priceLabel: 'COP $11.990.000 + retenciones',
  },
  {
    value: 'diamond',
    label: 'Plan Diamond',
    audience:
      'Para las marcas que quieren posicionarse donde nacen las próximas grandes oportunidades de negocio.',
    benefits: [
      'Espacio para producción y montaje en la Zona de Networking.',
      '1 mes de publicidad en indicecolombia.com, sharkcaribe.co y @shark.caribe.',
      '10 boletos de acceso VIP.',
      'Access publicitario co-branding: zona de networking.',
      'Branding en las piezas oficiales del evento: escarapelas, manillas, invitación digital, pantalla y backing multilogo impreso.',
    ],
    priceLabel: 'COP $25.000.000 + retenciones',
  },
  {
    value: 'platinum',
    label: 'Plan Platinum',
    audience:
      'Para las marcas que desean dejar huella y convertirse en protagonistas del evento.',
    benefits: [
      'Cofinanciamiento de ingreso al Bootcamp de Entrenamiento Shark Caribe Tech.',
      'Curaduría.',
      'Speaker de 20 minutos durante el módulo de cierre del Bootcamp de Entrenamiento Shark Caribe Tech.',
      'Jurado calificador durante el evento.',
    ],
    extraBenefits: [
      'Espacio de 3 × 5 m² en la galería empresarial.',
      '1 mes de publicidad en indicecolombia.com, sharkcaribe.co y @shark.caribe.',
      '15 boletos de acceso VIP.',
      'Access publicitario co-branding: zonas de acceso a elevadores – mesa de jurados.',
      'Branding en las piezas oficiales del evento: escarapelas, manillas, invitación digital, pantalla y backing multilogo impreso.',
      'Placa de reconocimiento.',
    ],
    priceLabel: 'COP $35.000.000 + retenciones',
  },
]

/* Etiquetas extra para filas antiguas en admin */
export const SPONSOR_PLAN_LABELS = [
  ...SPONSOR_PLANS,
  {
    value: 'emprendedor_bronce',
    label: 'Plan Emprendedor - Bronce (legado)',
  },
  { value: 'elite', label: 'Plan Élite' },
  { value: 'muestra_comercial', label: 'Muestra Comercial (legado)' },
  {
    value: 'aliado_institucional',
    label: 'Aliado Institucional / Co-financiador',
  },
]

/* Badges visibles en la sección de patrocinadores */
export const SPONSOR_BADGES = [
  { id: 'emprendedor', label: 'Plan Emprendedor' },
  { id: 'bronce', label: 'Plan Bronce' },
  { id: 'silver', label: 'Plan Silver' },
  { id: 'diamond', label: 'Plan Diamond' },
  { id: 'platinum', label: 'Plan Platinum' },
]

/* ============================================================
   FORMULARIO · EXPOSITORES (MUESTRA COMERCIAL)
   Valores alineados con enums de exhibitor_registrations.
   ============================================================ */

export const EXHIBITOR_REGISTRATION = {
  title: 'Registro de expositor · Muestra comercial',
  intro:
    'Reserva tu stand en la muestra comercial de Shark Caribe 2026. Completa el formulario y el equipo comercial te contactará para confirmar tu espacio.',
}

export const MUESTRA_COMERCIAL = {
  eyebrow: 'Categoría expositores · Pitch Competition by Shark Caribe',
  title: 'Muestra comercial',
  intro:
    'Para las empresas que desean exhibir sus productos y servicios, fortalecer su posicionamiento y generar oportunidades de negocio frente a más de 300 asistentes.',
  includesLabel: 'Stand dotado con',
  includes: [
    'Backing',
    'Iluminación',
    'Jardinera',
    'Punto eléctrico 110v',
    'Mesa tipo bar',
    'Dos sillas',
  ],
  terms: 'TyC: el diseño del arte es por cuenta del cliente.',
  venueLabel: 'Salón Los Laureles',
  venuePlace: 'Hotel Dann Carlton · Barranquilla',
  cta: 'Reservar stand',
  closing:
    'Conviértete en aliado estratégico de Shark Caribe y conecta tu marca con el ecosistema de innovación más importante de la región.',
}

export const EXHIBITOR_STAND_TYPES = [
  {
    value: 'stand_2x2',
    label: 'Stand 2.0 × 2.0 m ($2.500.000 COP)',
    shortLabel: 'Stand 2.0 × 2.0 m',
    dimensions: '2.0 × 2.0 m',
    price: '$2.500.000',
    priceLabel: 'COP $2.500.000',
    featured: true,
  },
  {
    value: 'stand_2x16',
    label: 'Stand 2.0 × 1.6 m ($1.500.000 COP)',
    shortLabel: 'Stand 2.0 × 1.6 m',
    dimensions: '2.0 × 1.6 m',
    price: '$1.500.000',
    priceLabel: 'COP $1.500.000',
    featured: false,
  },
]

/* Opciones del menú Inscríbete (Hero y Navbar) → formulario unificado */
export const REGISTER_OPTIONS = [
  {
    id: 'publico_preferencial',
    label: 'Público Preferencial',
    seatType: 'preferencial',
  },
  {
    id: 'publico_general',
    label: 'Público General',
    seatType: 'general',
  },
  { id: 'patrocinador', label: 'Patrocinador' },
  { id: 'expositor', label: 'Expositor muestra comercial' },
  { id: 'participante', label: 'Competidor' },
]

export const NAV_LINKS = [
  // { label: 'Emprendimientos', href: '#emprendimientos' },
  // { label: '2ª Ronda', href: '#segunda-ronda' },
  { label: 'Semifinal', href: '#gran-final' },
  { label: 'Jurados', href: '#jurados' },
  { label: 'Patrocinadores', href: '#patrocinadores' },
  { label: 'Muestra comercial', href: '#muestra-comercial' },
  { label: 'Premios', href: '#premios' },
  // { label: 'Competidores', href: '#competidores' },
  { label: 'Entradas', href: '#entradas' },
  { label: 'Novedades', href: '#novedades' },
  { label: 'Quiénes somos', href: '#quienes-somos' },
  // { label: 'Ediciones', href: '#ediciones' },
  // { label: 'Testimonios', href: '#testimonios' },
  { label: 'Instagram', href: '#instagram' },
  { label: 'Galería', href: '#galeria' },
  // { label: 'Contacto', href: '#contacto' },
]

/* Anuncio 2ª ronda pitch presencial */
export const PITCH_ROUND = {
  eyebrow: 'Próximo hito',
  badge: '2DA RONDA',
  title: 'Pitch presencial ante jueces',
  dateLabel: 'Martes 18 de agosto',
  timeLabel: '8:00 a. m. – 5:00 p. m.',
  venue: 'Salón Nexus · Hotel IBIS Barranquilla',
  address: 'Calle 86 No. 50-66',
  mapsUrl: 'https://maps.app.goo.gl/Gc66AaaKXvH6i7cVA',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=Hotel+Ibis+Barranquilla+Calle+86+%23+50-66&z=16&output=embed',
  mapsCta: 'Abrir en Google Maps',
  hotelLogo: '/logoibis.png',
  sharky: '/sharkycolor.png',
  judgesTitle: 'Jurados evaluadores',
  judges: [
    {
      name: 'Juan Manuel Calero',
      title: 'Gestor de Emprendimiento SENA',
      photo: '/2ronda/calero.jpeg',
    },
    {
      name: 'Jonathan Quant',
      title: 'Magíster en Gobierno de Tecnología Informática',
      photo: '/2ronda/quant.jpeg',
    },
    {
      name: 'Isa Severiche',
      title: 'Publicista · CEO Shark Caribe Pitch Competition',
      photo: '/2ronda/isa.jpeg',
    },
    {
      name: 'Ricardo Insignares',
      title:
        'Arquitecto y gerente del Centro Comercial Buenavista por 25 años.',
      photo: '/2ronda/ricardo.jpeg',
    },
    {
      name: 'Christian Carvajalino',
      title: 'Decano Prime Business School',
      photo: '/2ronda/chris.jpeg',
    },
  ],
}

/* Anuncio semifinalistas · camino a la Gran Final */
export const FINAL_ROUND = {
  eyebrow: 'Próximo hito',
  badge: 'SEMIFINALISTAS',
  title: 'Ellos avanzan a la semifinal',
  lead:
    'Los semifinalistas se preparan para el gran cierre. La Gran Final será el 25 de noviembre de 2026.',
  finalistsTitle: 'Semifinalistas',
  emptyFinalists:
    'Pronto revelaremos a quienes avanzan a la semifinal.',
  trainingTitle: 'Programa de entrenamiento',
  trainingBody:
    'Como parte del compromiso de Shark Caribe Pitch Competition con el fortalecimiento empresarial de los emprendedores en competencia, desarrollamos a través de la Universidad Sergio Arboleda el PROGRAMA DE ENTRENAMIENTO EN COMUNICACIÓN ESTRATÉGICA diseñado para mejorar las capacidades de negociación y potencializar la propuesta de valor de los emprendimientos ante potenciales clientes e inversionistas.',
  ticketsCta: 'Compra tu entrada a la Gran Final',
  ticketsHref: '#entradas',
  dateLabel: 'Miércoles 25 de noviembre',
  yearLabel: '2026',
  timeLabel: '5:00 p. m. – 9:45 p. m.',
  venue: 'Hotel Dann Carlton',
  address: 'Calle 98 No. 52B-10, Riomar · Barranquilla',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Hotel+Dann+Carlton+Barranquilla+Calle+98',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=Hotel+Dann+Carlton+Barranquilla+Calle+98+No+52B-10&z=16&output=embed',
  mapsCta: 'Abrir en Google Maps',
  sharky: '/sharkycolor.png',
}

/* Fotos de concursantes (public/concursantes) emparejadas por nombre del emprendimiento */
export const COMPETITOR_PHOTOS = [
  { match: /nobaq/i, photo: '/concursantes/Nobaq (1).jpeg' },
  { match: /ayuda\s*dom[eé]stica|\btad\b/i, photo: '/concursantes/tad.jpeg' },
  { match: /oportunitic/i, photo: '/concursantes/OportuniTIC.jpeg' },
  { match: /hey\s*eva|eva\s*native/i, photo: '/concursantes/HeyEvaNative.jpeg' },
  {
    match: /taller\s*de\s*ingrid|accesorios\s*el\s*taller/i,
    photo: '/concursantes/EltallerdeIngrid.jpeg',
  },
  { match: /gastro|optimai?zer/i, photo: '/concursantes/Gastro Optimaizer.jpeg' },
  { match: /legal[\s-]*ia/i, photo: '/concursantes/LegalIA.jpeg' },
  { match: /\bmito\b/i, photo: '/concursantes/mito.jpeg' },
  { match: /comp[aá]s|cv\s*car|cvcar|cv\s*card|cvcard/i, photo: '/concursantes/Cvcar.jpeg' },
  { match: /sweet\s*liz|sweetliz/i, photo: '/concursantes/SweetLiz.jpeg' },
  { match: /menu\s*be|menube/i, photo: '/concursantes/menube.jpeg' },
  {
    match: /origen\s*quillero|quillero/i,
    photos: ['/concursantes/quillero.jpeg'],
  },
  {
    match: /ferrel\s*a|ferrela|ferreia/i,
    photos: ['/concursantes/ferreia.jpeg'],
  },
  { match: /\bkefp\b|\bkfep\b/i, photo: '/concursantes/kfep.jpeg' },
  { match: /\balora\b/i, photo: '/concursantes/alora.jpeg' },
  {
    match: /tulipancito|gurumi/i,
    photo: '/concursantes/tulipancito.jpeg',
  },
  { match: /\blynka\b/i, photo: '/concursantes/lynka.jpeg' },
]

export function resolveCompetitorPhotos(ventureName = '') {
  const name = String(ventureName)
  const hit = COMPETITOR_PHOTOS.find((entry) => entry.match.test(name))
  if (!hit) return []
  if (Array.isArray(hit.photos) && hit.photos.length) return hit.photos
  return hit.photo ? [hit.photo] : []
}

/** @deprecated Prefer resolveCompetitorPhotos */
export function resolveCompetitorPhoto(ventureName = '') {
  return resolveCompetitorPhotos(ventureName)[0] || ''
}

/* Premios Gran Final */
export const PRIZES = {
  eyebrow: 'Gran Final',
  badge: 'Pitch Competition',
  title: 'Premios',
  dateLabel: '25 de noviembre de 2026',
  sharky: '/sharky.png',
  podium: [
    {
      place: '1er lugar',
      amount: '$5 M',
      detail: 'de pesos en efectivo',
      emoji: '🥇',
      tier: 'gold',
    },
    {
      place: '2do lugar',
      amount: '$2 M',
      detail: 'de pesos en efectivo',
      emoji: '🥈',
      tier: 'silver',
    },
    {
      place: '3er lugar',
      amount: '$1 M',
      detail: 'de pesos en efectivo',
      emoji: '🥉',
      tier: 'bronze',
    },
  ],
  alliesNote: 'Más premios de las entidades aliadas',
  mentionsTitle: 'Menciones especiales',
  mentions: [
    { label: 'Innovación', emoji: '💡' },
    { label: 'Sostenibilidad', emoji: '🌱' },
    { label: 'Tradición', emoji: '🧵' },
    { label: 'Turismo', emoji: '🌴' },
    { label: 'Impacto social', emoji: '🤝' },
  ],
}

/* Jurados — foto en /public/jurados/; el nombre va en la foto.
   name se usa solo para accesibilidad (alt / aria). */
export const JUDGES = [
  {
    name: 'Ricardo Insignares',
    title: 'Gerente Centro Comercial Buenavista',
    photo: '/jurados/ricardo.jpeg',
    instagramUrl:
      'https://www.instagram.com/reel/DbdXGPrRU2s/?igsh=dDcxeDl1MjFyeG8=',
  },
  {
    name: 'Kike De Lavalle Tcherassi',
    title: 'Gerente General y Fundador, De Lavalle Tcherassi S.A.S.',
    photo: '/jurados/kike.jpeg',
    instagramUrl: '',
  },
  {
    name: 'César Prada',
    title:
      'CEO de Prago International con sedes en Colombia, Ecuador, Peru & Chile.',
    photo: '/jurados/cesar.jpeg',
    instagramUrl: '',
  },
]

/* Emprendimientos concursantes — round: 'inscrito' | 'segunda_ronda' */
export const VENTURES = [
  { name: 'Costa Tech', sector: 'Base tecnológica', logo: '', round: 'inscrito' },
  { name: 'Mar y Café', sector: 'Turismo', logo: '', round: 'inscrito' },
  { name: 'Hilos del Caribe', sector: 'Textiles', logo: '', round: 'inscrito' },
  { name: 'Arcilla Viva', sector: 'Cerámica', logo: '', round: 'inscrito' },
  { name: 'Madera Nómada', sector: 'Madera', logo: '', round: 'inscrito' },
  { name: 'Raíz Sostenible', sector: 'Oficios rurales', logo: '', round: 'segunda_ronda' },
  { name: 'Piel Atlántica', sector: 'Cuero y calzado', logo: '', round: 'segunda_ronda' },
  { name: 'Arte Barrial', sector: 'Artes plásticas', logo: '', round: 'segunda_ronda' },
]

/* Noticias del evento en medios */
export const NEWS = {
  background: '/album/2023/Imagen8.jpg',
  titleSolid: 'Explora',
  logo: '/sharkcirculo.jpeg',
  subtitle: 'Novedades y coberturas del ecosistema Shark Caribe.',
  items: [
    {
      title: 'Shark Caribe abre convocatoria para impulsar emprendimientos del Caribe',
      excerpt:
        'LaVibrante: convocatoria abierta hasta el 10 de agosto para la cuarta edición del Pitch Competition.',
      image: '/album/2024/Imagen12.jpg',
      href: 'https://lavibrante.com/shark-caribe-abre-convocatoria-para-impulsar-los-emprendimientos-que-transforman-el-caribe/',
      cta: 'Leer más',
    },
    {
      title: 'Abierta convocatoria para emprendedores en la IV edición',
      excerpt:
        'La Esquina Deportes y Algo Más: sectores convocados, categorías Junior, Prime y Silver +50.',
      image: '/album/2024/Imagen13.jpg',
      href: 'https://www.laesquinadeportesyalgomas.com/abierta-convocatoria-para-los-emprendedores-en-la-iv-edicion-de-shark-caribe/',
      cta: 'Leer más',
    },
    {
      title: 'Pitch Competition 2026 busca impulsar el emprendimiento del Caribe',
      excerpt:
        'Ey Boricua: Barranquilla como punto de encuentro entre innovación, tradición y proyección internacional.',
      image: '/album/2024/Imagen14.jpg',
      href: 'https://eyboricua.com/shark-caribe-pitch-competition-abre-convocatoria-para-la-iv-edicion-y-busca-impulsar-el-emprendimiento-que-transforma-el-caribe/',
      cta: 'Leer más',
    },
    {
      title: 'Convocatoria IV edición del Pitch Competition 2026',
      excerpt:
        'Índice Colombia: requisitos, fechas clave y el llamado a transformar el Caribe con emprendimiento.',
      image: '/album/2024/Imagen15.jpg',
      href: 'https://indicecolombia.com/2026/07/16/shark-caribe-abre-convocatoria-para-la-iv-edicion-del-pitch-competition-2026-y-busca-impulsar-el-emprendimiento-que-transforma-el-caribe/',
      cta: 'Leer más',
    },
  ],
}

export const HERO = {
  titlePitch: 'Pitch',
  titleCompetition: 'Competition',
  brandLine: 'by',
  brand: 'Shark Caribe',
  meta: '25/11/2026 - Hotel Dann Carlton Barranquilla',
  supportMessage: 'Asiste y apoya a los participantes',
  ctaLabel: 'Compra aquí',
}

/* Sección competidores + calendario (debajo del hero) */
/* Avance del concurso (enum competitor_competition_stage en Supabase) */
export const COMPETITION_STAGES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'segunda_vuelta', label: 'Segunda vuelta' },
  { value: 'tercera_vuelta', label: 'Tercera vuelta' },
  { value: 'final', label: 'Final' },
  { value: 'ganador', label: 'Ganador' },
  { value: 'rechazado', label: 'Rechazado' },
]

/** Orden de avance (sin rechazado). */
export const COMPETITION_STAGE_ORDER = [
  'pendiente',
  'aprobado',
  'segunda_vuelta',
  'tercera_vuelta',
  'final',
  'ganador',
]

export const COMPETITION = {
  eyebrow: 'Pitch Competition',
  title: 'Para competidores',
  intro:
    'Información clara para quienes van a postular sus startups o proyectos.',
  categories: [
    {
      label: 'Junior',
      description: 'Jóvenes emprendedores de hasta 17 años.',
    },
    {
      label: 'Prime',
      description: 'Emprendedores de 18 a 45 años.',
    },
    {
      label: 'Silver +50',
      description: 'Emprendedores mayores de 50 años que se reinventan.',
    },
  ],
  sectorsNote: '',
  sectors: [
    'Startups de base tecnológica',
    'Turismo',
    'Textiles y confección',
    'Cuero y calzado',
    'Cerámica y arcilla',
    'Madera y construcción ligera',
    'Artes plásticas',
    'Manualidades',
    'Oficios rurales y sostenibles',
  ],
  requirements: [
    'Contar con producto mínimo viable validado.',
    'Pertenecer a uno de los sectores definidos.',
    'Presentar un pitch de máximo 3 a 5 minutos.',
    'Haber recibido capital semilla u otro estímulo de crecimiento para su negocio.',
    'Entregar una ficha de caracterización: emprendimiento, problema que resuelve, cliente objetivo, propuesta de valor, ventas o validación, necesidades y proyección.',
    'Contar con evidencia visual: muestra física, fotos, catálogo, prototipo, video o demostración.',
    'En la categoría Junior, los postulados deben adjuntar carta de autorización firmada por los padres o adulto responsable.',
    'Aceptar que el negocio podrá ser divulgado con fines de promoción del evento.',
  ],
  cta: 'Postularme ahora',
}

export const SCHEDULE = {
  eyebrow: 'Cronograma oficial',
  title: 'Calendario',
  intro: 'Línea de tiempo clara del proceso de la competencia.',
  milestones: [
    { date: '5 Jul – 10 Ago', event: 'Inscripciones abiertas.' },
    {
      date: '10 Ago – 13 Ago',
      event: 'Evaluación y 1ª ronda de preselección.',
    },
    { date: '14 Ago', event: 'Presentación y 2ª ronda.' },
    {
      date: '15 Ago – 31 Oct',
      event: 'Bootcamp de entrenamiento intensivo.',
    },
    {
      date: '25 Nov',
      event: 'Gran Final / Gala Pitch Competition (Hotel Dann Carlton).',
    },
  ],
  galaTitle: 'Agenda de la Gala',
  galaSubtitle: '25 de noviembre · Hotel Dann Carlton',
  galaAgenda: [
    {
      time: '5:00 PM – 6:30 PM',
      detail: 'Pitch de finalistas.',
    },
    {
      time: '6:30 PM – 7:30 PM',
      detail: 'Deliberación de los Sharks.',
    },
    {
      time: '7:30 PM – 8:30 PM',
      detail: 'Invitados especiales.',
    },
    {
      time: '8:30 PM – 9:45 PM',
      detail: 'Premiación y cierre.',
    },
  ],
}

export const ABOUT = {
  title: '¿Por qué existe Shark Caribe Pitch Competition?',
  paragraphs: [
    'Shark Caribe Pitch Competition existe para poner a prueba la creatividad e innovación de los emprendedores en etapa de escalabilidad que ofrezcan respuesta a necesidades insatisfechas del mercado, a través de un concurso que otorga a los finalistas un entrenamiento intensivo de preparación para la competencia y la oportunidad de disputar premios y visibilidad que impulsen el crecimiento de sus negocios. También existe como una plataforma que impulsa el emprendimiento en el Caribe colombiano, conectando a innovadores y visionarios con empresarios, inversionistas, universidades y aliados estratégicos.',
    'Desde 2022, este evento de ciudad multipropósito se ha consolidado como un espacio único donde tradición e innovación dialogan, integrando oficios ancestrales con propuestas tecnológicas y turísticas de alto impacto, y demostrando que el talento del Caribe puede transformar la economía regional y proyectarse al mundo, generando valor social, cultural y económico.',
  ],
  stats: [
    { value: '2022', label: 'Primera edición' },
    { value: '2023', label: 'Segunda edición' },
    { value: '2024', label: 'Tercera edición' },
    { value: '2026', label: 'Cuarta edición' },
  ],
}

export const EDITIONS = [
  {
    year: '2024',
    title: 'Tercera edición',
    description: 'La tercera edición consolidó a Shark Caribe como un referente del emprendimiento en la región.',
    image: '',
  },
  {
    year: '2023',
    title: 'Segunda edición',
    description: 'La segunda edición amplió el alcance del evento y su comunidad de emprendedores.',
    image: '',
    videoUrl: 'https://www.youtube.com/live/UH1CHKC97WU',
  },
  {
    year: '2022',
    title: 'Primera edición',
    description: 'El punto de partida: la primera edición de Shark Caribe reunió a emprendedores y empresarios del Caribe.',
    image: '',
  },
]

export const TESTIMONIALS = [
  { name: 'Nombre Apellido', role: 'Asistente 2025', quote: 'Una experiencia increíble, sin duda repetiré el próximo año.' },
  { name: 'Nombre Apellido', role: 'Asistente 2024', quote: 'La organización y el ambiente fueron espectaculares.' },
  { name: 'Nombre Apellido', role: 'Ponente 2023', quote: 'Un evento de referencia en el sector. Muy recomendable.' },
]

/* Rellena con tus fotos. Cada entrada: { src, alt } */
export const GALLERY = [
  { src: '/album/2022/Imagen1.jpg', alt: 'Shark Caribe 2022' },
  { src: '/album/2022/Imagen2.jpg', alt: 'Shark Caribe 2022' },
  { src: '/album/2022/Imagen3.jpg', alt: 'Shark Caribe 2022' },
  { src: '/album/2022/Imagen4.jpg', alt: 'Shark Caribe 2022' },
  { src: '/album/2022/Imagen5.jpg', alt: 'Shark Caribe 2022' },
  { src: '/album/2023/Imagen6.jpg', alt: 'Shark Caribe 2023' },
  { src: '/album/2023/Imagen7.jpg', alt: 'Shark Caribe 2023' },
  { src: '/album/2023/Imagen8.jpg', alt: 'Shark Caribe 2023' },
  { src: '/album/2023/Imagen9.jpg', alt: 'Shark Caribe 2023' },
  { src: '/album/2023/Imagen10.jpg', alt: 'Shark Caribe 2023' },
  { src: '/album/2023/Imagen11.jpg', alt: 'Shark Caribe 2023' },
  { src: '/album/2024/Imagen12.jpg', alt: 'Shark Caribe 2024' },
  { src: '/album/2024/Imagen13.jpg', alt: 'Shark Caribe 2024' },
  { src: '/album/2024/Imagen14.jpg', alt: 'Shark Caribe 2024' },
  { src: '/album/2024/Imagen15.jpg', alt: 'Shark Caribe 2024' },
  { src: '/album/2024/Imagen16.jpg', alt: 'Shark Caribe 2024' },
]

export const CONTACT = {
  title: 'Contáctanos',
  subtitle: '¿Tienes preguntas sobre el evento? Escríbenos y te ayudamos.',
  email: 'info@sharkcaribe.com',
  phone: '+57 000 000 0000',
  location: 'Hotel Dann Carlton · Barranquilla, Colombia',
  organizer: 'Organiza: IS Comunicaciones',
}
