import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Editions from './components/Editions.jsx'
import Testimonials from './components/Testimonials.jsx'
import Gallery from './components/Gallery.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Editions />
        <Testimonials />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
