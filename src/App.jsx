import { useCallback, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Competition from './components/Competition.jsx'
import About from './components/About.jsx'
import Editions from './components/Editions.jsx'
import Gallery from './components/Gallery.jsx'
import Sponsors from './components/Sponsors.jsx'
import News from './components/News.jsx'
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
        <Competition onRegister={openRegister} />
        <Sponsors />
        <News />
        <About />
        <Editions />
        {/* <Testimonials /> */}
        <Gallery />
        {/* <Contact /> */}
      </main>
      <Allies />
      <Footer />
      {registerOpen && <RegisterModal onClose={closeRegister} />}
    </>
  )
}
