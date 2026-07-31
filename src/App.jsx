import { useCallback, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Competition from './components/Competition.jsx'
// import Judges from './components/Judges.jsx'
// import Ventures from './components/Ventures.jsx'
import About from './components/About.jsx'
// import Editions from './components/Editions.jsx'
import Gallery from './components/Gallery.jsx'
import Sponsors from './components/Sponsors.jsx'
import News from './components/News.jsx'
import Allies from './components/Allies.jsx'
import Footer from './components/Footer.jsx'
import RegisterModal from './components/RegisterModal.jsx'
import AttendeeModal from './components/AttendeeModal.jsx'
import SponsorModal from './components/SponsorModal.jsx'

export default function App() {
  const [registerKind, setRegisterKind] = useState(null)

  const openRegister = useCallback((kind = 'participante') => {
    const allowed = new Set(['participante', 'asistente', 'patrocinador'])
    setRegisterKind(allowed.has(kind) ? kind : 'participante')
  }, [])
  const closeRegister = useCallback(() => setRegisterKind(null), [])

  return (
    <>
      <Navbar onRegister={openRegister} />
      <main>
        <Hero onRegister={openRegister} />
        <Competition onRegister={openRegister} />
        {/* <Judges /> */}
        {/* <Ventures /> */}
        <Sponsors onRegister={openRegister} />
        <News />
        <About />
        {/* <Editions /> */}
        {/* <Testimonials /> */}
        <Gallery />
        {/* <Contact /> */}
      </main>
      <Allies />
      <Footer />
      {registerKind === 'participante' && (
        <RegisterModal onClose={closeRegister} />
      )}
      {registerKind === 'asistente' && <AttendeeModal onClose={closeRegister} />}
      {registerKind === 'patrocinador' && (
        <SponsorModal onClose={closeRegister} />
      )}
    </>
  )
}
