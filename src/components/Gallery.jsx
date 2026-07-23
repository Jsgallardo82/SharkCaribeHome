import { GALLERY } from '../data/content.js'
import './Gallery.css'

export default function Gallery() {
  return (
    <section id="galeria" className="section section--alt">
      <div className="container">
        <h2 className="section__title">Galería</h2>
        <p className="section__subtitle">
          Momentos que hacen especial a nuestro evento.
        </p>
        <div className="gallery__grid">
          {GALLERY.map((photo, i) => (
            <div key={i} className="gallery__item">
              {photo.src ? (
                <img src={photo.src} alt={photo.alt} loading="lazy" />
              ) : (
                <div className="gallery__placeholder">Foto {i + 1}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
