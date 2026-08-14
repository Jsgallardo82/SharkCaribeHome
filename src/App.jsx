import { useCallback, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Competition from './components/Competition.jsx'
import Judges from './components/Judges.jsx'
import Ventures from './components/Ventures.jsx'
import PitchRound from './components/PitchRound.jsx'
import Prizes from './components/Prizes.jsx'
import About from './components/About.jsx'
// import Editions from './components/Editions.jsx'
import Gallery from './components/Gallery.jsx'
import Sponsors from './components/Sponsors.jsx'
import Entradas from './components/Entradas.jsx'
import MuestraComercial from './components/MuestraComercial.jsx'
import News from './components/News.jsx'
import Allies from './components/Allies.jsx'
import Footer from './components/Footer.jsx'
import RegisterModal from './components/RegisterModal.jsx'
import ClosedCompetitorModal from './components/ClosedCompetitorModal.jsx'
import AttendeeModal from './components/AttendeeModal.jsx'
import SponsorModal from './components/SponsorModal.jsx'
import ExhibitorModal from './components/ExhibitorModal.jsx'
import { isCompetitorRegistrationOpen } from './data/content.js'

export default function App() {
  const [registerKind, setRegisterKind] = useState(null)
  const [attendeeSeatType, setAttendeeSeatType] = useState('')
  const [exhibitorStandType, setExhibitorStandType] = useState('')

  const openRegister = useCallback((kind = 'participante', options = {}) => {
    const allowed = new Set([
      'participante',
      'asistente',
      'patrocinador',
      'expositor',
    ])
    const next = allowed.has(kind) ? kind : 'participante'

    if (next === 'participante' && !isCompetitorRegistrationOpen()) {
      setAttendeeSeatType('')
      setExhibitorStandType('')
      setRegisterKind('participante-cerrado')
      return
    }

    setAttendeeSeatType(next === 'asistente' ? options.seatType || '' : '')
    setExhibitorStandType(next === 'expositor' ? options.standType || '' : '')
    setRegisterKind(next)
  }, [])
  const closeRegister = useCallback(() => {
    setRegisterKind(null)
    setAttendeeSeatType('')
    setExhibitorStandType('')
  }, [])

  return (
    <>
      <Navbar onRegister={openRegister} />
      <main>
        <Hero onRegister={openRegister} />
        <Ventures />
        <PitchRound />
        <Prizes />
        <Competition onRegister={openRegister} />
        <Sponsors onRegister={openRegister} />
        <MuestraComercial onRegister={openRegister} />
        <Entradas onRegister={openRegister} />
        <Judges />
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
      {registerKind === 'participante-cerrado' && (
        <ClosedCompetitorModal onClose={closeRegister} />
      )}
      {registerKind === 'asistente' && (
        <AttendeeModal
          onClose={closeRegister}
          initialSeatType={attendeeSeatType}
        />
      )}
      {registerKind === 'patrocinador' && (
        <SponsorModal onClose={closeRegister} />
      )}
      {registerKind === 'expositor' && (
        <ExhibitorModal
          onClose={closeRegister}
          initialStandType={exhibitorStandType}
        />
      )}
    </>
  )
}
