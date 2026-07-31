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

/* Términos de referencia de la competencia (documento descargable en /public) */
export const TERMS_URL =
  '/shark%20caribe%20Pitch%20Competition%202026%20t%C3%A9rminos%20de%20referencia%20-%20v1.docx'

/* Modos de inscripción que rotan en las cajas 2 y 3 del hero (el fondo es fijo).
   action 'modal' -> abre el formulario del tipo (participante | patrocinador | asistente) */
export const HERO_MODES = [
  {
    id: 'participante',
    title: 'Participante',
    cta: 'Inscríbete',
    alt: 'Inscripción de participantes',
    action: 'modal',
    details: [
      {
        title: 'Shark Caribe 2026',
        text: 'Donde nacen los próximos grandes negocios',
      },
      { title: 'Inscripciones abiertas' },
      { title: 'Valor', text: '$15.000 COP' },
    ],
  },
  {
    id: 'patrocinador',
    title: 'Patrocinador',
    cta: 'Inscríbete',
    alt: 'Inscripción de patrocinadores y muestra comercial',
    action: 'modal',
    details: [
      {
        title: 'Elite',
        text: 'Para las empresas que quieren',
        emphasis: 'dejar huella.',
      },
      {
        title: 'Platinium',
        text: 'Para las empresas que quieren',
        emphasis: 'abrir conversaciones.',
      },
      {
        title: 'Diamond',
        text: 'Para las empresas que quieren estar donde ocurren las',
        emphasis: 'oportunidades.',
      },
    ],
  },
  {
    id: 'asistente',
    title: 'Asistente',
    cta: 'Inscríbete',
    alt: 'Inscripción de asistentes',
    action: 'modal',
    details: [{ title: 'Inscripciones abiertas', text: '80k' }],
  },
]

/* Organizador. */
export const ORGANIZER = { name: 'IS Comunicaciones', logo: '/logos/iss.jpeg' }

/* Aliados estratégicos (logos en /public/logos). */
export const ALLIES = [
  { name: 'Universidad Sergio Arboleda', sub: 'Barranquilla', logo: '/logos/sergioarboleda.png' },
  { name: 'Prime Business School', sub: 'Universidad Sergio Arboleda', logo: '/logos/prime.png' },
  { name: 'SENA', sub: '', logo: '/logos/sena.png' },
  { name: 'Universidad Autónoma del Caribe', sub: 'Vigilada Mineducación', logo: '/logos/AUTONOMA.png' },
  { name: 'Índice', sub: '', logo: '/logos/indice.png' },
  { name: 'FCA', sub: '', logo: '/logos/fca.png' },
]

/* Correo al que se envían los soportes de pago y la fotocopia del documento */
export const SUPPORT_EMAIL = 'eventos@shark.caribe.co'

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
  feeAmount: 'COP $80.000',
  feeHint:
    'Al enviar el formulario te confirmamos el registro. Si aplica pago, te indicamos los siguientes pasos por correo o WhatsApp.',
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
  { value: 'preferencial', label: 'Preferencial' },
  { value: 'general', label: 'General' },
]

/* ============================================================
   FORMULARIO · PATROCINADORES Y EXPOSITORES
   Valores alineados con enums de sponsor_registrations.
   ============================================================ */

export const SPONSOR_REGISTRATION = {
  title: 'Registro de patrocinadores y expositores',
  intro:
    'Vincula tu marca a Shark Caribe 2026. Completa el formulario y el equipo comercial te contactará para cerrar tu plan.',
}

export const SPONSOR_PLANS = [
  {
    value: 'emprendedor_bronce',
    label: 'Plan Emprendedor - Bronce ($3.500.000 COP)',
  },
  { value: 'silver', label: 'Plan Silver ($6.900.000 COP)' },
  { value: 'diamond', label: 'Plan Diamond ($11.990.000 COP)' },
  { value: 'platinum', label: 'Plan Platinum ($25.000.000 COP)' },
  { value: 'elite', label: 'Plan Élite ($50.000.000 COP)' },
  {
    value: 'muestra_comercial',
    label: 'Muestra Comercial / Stand ($2.300.000 COP)',
  },
  {
    value: 'aliado_institucional',
    label: 'Aliado Institucional / Co-financiador',
  },
]

export const NAV_LINKS = [
  { label: 'Competidores', href: '#competidores' },
  // { label: 'Jurados', href: '#jurados' },
  // { label: 'Emprendimientos', href: '#emprendimientos' },
  { label: 'Novedades', href: '#novedades' },
  { label: 'Quiénes somos', href: '#quienes-somos' },
  // { label: 'Ediciones', href: '#ediciones' },
  // { label: 'Testimonios', href: '#testimonios' },
  { label: 'Galería', href: '#galeria' },
  // { label: 'Contacto', href: '#contacto' },
]

/* Jurados — foto en /public/judges/; instagramUrl = reel o perfil */
export const JUDGES = [
  {
    name: 'Nombre Apellido',
    title: 'Cargo / empresa',
    photo: '',
    instagramUrl: 'https://www.instagram.com/shark.caribe/',
  },
  {
    name: 'Nombre Apellido',
    title: 'Cargo / empresa',
    photo: '',
    instagramUrl: 'https://www.instagram.com/shark.caribe/',
  },
  {
    name: 'Nombre Apellido',
    title: 'Cargo / empresa',
    photo: '',
    instagramUrl: 'https://www.instagram.com/shark.caribe/',
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
  titleSolid: 'Explora Shark',
  titleOutline: 'Caribe',
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
}

/* Sección competidores + calendario (debajo del hero) */
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
  sectorsNote: 'Únicamente 9 sectores admitidos:',
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
    'Contar con Producto Mínimo Viable (PMV) validado.',
    'Haber recibido capital semilla u otro estímulo previo.',
    'Valor de inscripción: $15.000 COP.',
    'Enviar soportes requeridos y autorización firmada (categoría Junior).',
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
  title: '¿Por qué existe Shark Caribe?',
  paragraphs: [
    'Un evento de ciudad multipropósito que hace cuatro años conecta emprendedores con inversionistas, empresarios, instituciones y aliados estratégicos a través de un concurso que premia la creatividad e innovación de los emprendimientos que respondan a una necesidad insatisfecha del mercado.',
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
