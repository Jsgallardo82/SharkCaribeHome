import { CONTACT } from '../data/content.js'
import './Contact.css'

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: conectar con backend / servicio de email (ej. Formspree, EmailJS)
    alert('¡Gracias por registrarte! Nos pondremos en contacto contigo.')
    e.target.reset()
  }

  return (
    <section id="contacto" className="section">
      <div className="container">
        <div className="contact__inner">
        <div className="contact__info">
          <h2 className="section__title contact__title">{CONTACT.title}</h2>
          <p>{CONTACT.subtitle}</p>
          <ul className="contact__details">
            <li>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>
              <strong>Teléfono:</strong>{' '}
              <a href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a>
            </li>
            <li>
              <strong>Lugar:</strong> {CONTACT.location}
            </li>
            <li>{CONTACT.organizer}</li>
          </ul>
        </div>

        <form className="contact__form" onSubmit={handleSubmit}>
          <div className="contact__field">
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" type="text" required />
          </div>
          <div className="contact__field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="contact__field">
            <label htmlFor="message">Mensaje</label>
            <textarea id="message" name="message" rows="4" />
          </div>
          <button type="submit" className="btn btn--primary">
            Enviar mensaje
          </button>
        </form>
        </div>

        <img
          className="contact__banner"
          src="/banner%20inscripci%C3%B3n%20patrocinadores%20y%20muestra%20comercial.jpeg"
          alt="Inscripción de patrocinadores y muestra comercial — Shark Caribe"
        />
      </div>
    </section>
  )
}
