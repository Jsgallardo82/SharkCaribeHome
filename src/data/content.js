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

/* Inscripción de patrocinadores / muestra comercial.
   TODO: reemplazar por el destino real (formulario o correo de patrocinios).
   Por ahora apunta al formulario de Microsoft Forms como respaldo. */
export const SPONSOR_URL =
  'https://forms.office.com/pages/responsepage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAYAABGDyKtUNE1ZQ0k1ODhKNjFHMk1UTjhWRk0xSkpBUS4u&route=shorturl'

/* Términos de referencia de la competencia (documento descargable en /public) */
export const TERMS_URL =
  '/shark%20caribe%20Pitch%20Competition%202026%20t%C3%A9rminos%20de%20referencia%20-%20v1.docx'

/* Modos de inscripción que rotan en el carrusel del hero.
   Cada slide = una imagen + un mensaje + un botón.
   - action 'modal'  -> abre el formulario propio (RegisterModal, competidores)
   - action 'link'   -> abre el formulario viejo (Microsoft Forms) en pestaña nueva
   Deja "image" vacío para mostrar un placeholder. */
export const HERO_MODES = [
  {
    id: 'participante',
    title: 'Participante',
    text: 'Compite en la Pitch Competition: presenta tu emprendimiento ante el jurado y conecta con inversionistas.',
    cta: 'Inscríbete como participante',
    image: '', // TODO: falta el banner real de competidores
    alt: 'Inscripción de participantes',
    action: 'modal',
  },
  {
    id: 'patrocinador',
    title: 'Patrocinador',
    text: 'Lleva tu marca al escenario de Shark Caribe con patrocinios y muestra comercial.',
    cta: 'Inscríbete como patrocinador',
    image: '', // por definir
    alt: 'Inscripción de patrocinadores y muestra comercial',
    action: 'link',
    url: REGISTER_URL,
  },
  {
    id: 'asistente',
    title: 'Asistente',
    text: 'Vive la experiencia en vivo: charlas, pitches y networking con el ecosistema emprendedor del Caribe.',
    cta: 'Inscríbete como asistente',
    image: '', // por definir
    alt: 'Inscripción de asistentes',
    action: 'link',
    url: REGISTER_URL,
  },
]

/* Organizador. */
export const ORGANIZER = { name: 'IS Comunicaciones', logo: '/logos/iss.png' }

/* Aliados estratégicos (logos en /public/logos). */
export const ALLIES = [
  { name: 'Universidad Sergio Arboleda', sub: 'Barranquilla', logo: '/logos/sergioarboleda.png' },
  { name: 'Índice', sub: '', logo: '/logos/indice.png' },
  { name: 'SENA', sub: '', logo: '/logos/sena.png' },
  { name: 'Universidad Autónoma del Caribe', sub: 'Vigilada Mineducación', logo: '/logos/AUTONOMA.png' },
  { name: 'Prime Business School', sub: 'Universidad Sergio Arboleda', logo: '/logos/prime.png' },
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
  { value: 'sena', label: 'SENA' },
  { value: 'other', label: 'Otro' },
]

export const NAV_LINKS = [
  { label: 'Quiénes somos', href: '#quienes-somos' },
  { label: 'Ediciones', href: '#ediciones' },
  { label: 'Testimonios', href: '#testimonios' },
  { label: 'Galería', href: '#galeria' },
  // { label: 'Contacto', href: '#contacto' },
]

export const HERO = {
  kicker: '25 de Noviembre, 2026 · Barranquilla, Colombia',
  title: 'Shark Caribe Pitch Competition 2026',
  subtitle:
    'La competencia de pitch que impulsa a los emprendedores del Caribe. Vuelve una nueva edición del evento que ya es referente en la región.',
  ctaLabel: 'Inscríbete ahora',
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
