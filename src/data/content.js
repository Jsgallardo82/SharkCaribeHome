/* ============================================================
   CONTENIDO DEL SITIO
   Edita aquí los textos, ediciones, testimonios y galería.
   Las imágenes van en /src/assets y se importan, o se referencian
   desde /public. Por ahora se usan placeholders.
   ============================================================ */

/* URL del formulario de inscripción (Microsoft Forms) */
export const REGISTER_URL =
  'https://forms.office.com/pages/responsepage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAYAABGDyKtUNE1ZQ0k1ODhKNjFHMk1UTjhWRk0xSkpBUS4u&route=shorturl'

/* Redes sociales */
export const INSTAGRAM_URL =
  'https://www.instagram.com/shark.caribe?igsh=a3FiYWx0bTRsMWJv'

/* Términos de referencia de la competencia (documento descargable en /public) */
export const TERMS_URL =
  '/shark%20caribe%20Pitch%20Competition%202026%20t%C3%A9rminos%20de%20referencia%20-%20v1.docx'

export const NAV_LINKS = [
  { label: 'Quiénes somos', href: '#quienes-somos' },
  { label: 'Ediciones', href: '#ediciones' },
  { label: 'Testimonios', href: '#testimonios' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Contacto', href: '#contacto' },
]

export const HERO = {
  kicker: '25 de Noviembre, 2026 · Barranquilla, Colombia',
  title: 'Shark Caribe Pitch Competition 2026',
  subtitle:
    'La competencia de pitch que impulsa a los emprendedores del Caribe. Vuelve una nueva edición del evento que ya es referente en la región.',
  ctaLabel: 'Inscríbete ahora',
  ctaHref: REGISTER_URL,
}

export const ABOUT = {
  title: '¿Por qué existe Shark Caribe?',
  paragraphs: [
    'Somos el escenario donde las ideas se convierten en oportunidades y los negocios encuentran conexiones para crecer. Un espacio que reúne emprendedores y empresarios alrededor de la innovación.',
    'Hoy seguimos impulsando el talento emprendedor del Caribe.',
  ],
  stats: [
    { value: '2023', label: 'Primera edición' },
    { value: '2024', label: 'Segunda edición' },
    { value: '2026', label: 'Tercera edición' },
  ],
}

export const EDITIONS = [
  {
    year: '2024',
    title: 'Segunda edición',
    description: 'La segunda edición consolidó a Shark Caribe como un referente del emprendimiento en la región.',
    image: '',
  },
  {
    year: '2023',
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
  { src: '', alt: 'Foto del evento 1' },
  { src: '', alt: 'Foto del evento 2' },
  { src: '', alt: 'Foto del evento 3' },
  { src: '', alt: 'Foto del evento 4' },
  { src: '', alt: 'Foto del evento 5' },
  { src: '', alt: 'Foto del evento 6' },
]

export const CONTACT = {
  title: 'Contáctanos',
  subtitle: '¿Tienes preguntas sobre el evento? Escríbenos y te ayudamos.',
  email: 'info@sharkcaribe.com',
  phone: '+57 000 000 0000',
  location: 'Hotel Dann Carlton · Barranquilla, Colombia',
  organizer: 'Organiza: IS Comunicaciones',
}
