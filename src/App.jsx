import { useCallback, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Editions from './components/Editions.jsx'
import Testimonials from './components/Testimonials.jsx'
import Gallery from './components/Gallery.jsx'
import Contact from './components/Contact.jsx'
import Sponsors from './components/Sponsors.jsx'
import Allies from './components/Allies.jsx'
import Footer from './components/Footer.jsx'
import RegisterModal from './components/RegisterModal.jsx'

export default function App() {
  const [registerOpen, setRegisterOpen] = useState(false)

  const openRegister = useCallback(() => setRegisterOpen(true), [])
  const closeRegister = useCallback(() => setRegisterOpen(false), [])

  return (
    <>
      <Navbar onRegister={openRegister} />
      <main>
        <Hero onRegister={openRegister} />
        <About />
        <Editions />
        <Testimonials />
        <Gallery />
        <Sponsors />
        {/* <Contact /> */}
      </main>
      <Allies />
      <Footer />
      {registerOpen && <RegisterModal onClose={closeRegister} />}
    </>
  )
}
