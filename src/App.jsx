import { useCallback, useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
// import Competition from './components/Competition.jsx'
import Judges from './components/Judges.jsx'
// import Ventures from './components/Ventures.jsx'
// import PitchRound from './components/PitchRound.jsx'
import FinalRound from './components/FinalRound.jsx'
import Prizes from './components/Prizes.jsx'
import About from './components/About.jsx'
// import Editions from './components/Editions.jsx'
import Gallery from './components/Gallery.jsx'
import Sponsors from './components/Sponsors.jsx'
import Entradas from './components/Entradas.jsx'
import MuestraComercial from './components/MuestraComercial.jsx'
import News from './components/News.jsx'
import InstagramFeed from './components/InstagramFeed.jsx'
import Allies from './components/Allies.jsx'
import Footer from './components/Footer.jsx'
import UnifiedRegisterModal from './components/UnifiedRegisterModal.jsx'
import {
  installSharkySoundOnFirstGesture,
  playSharkySound,
} from './lib/sharkySound.js'

function resolveRegisterOpen(kind, options = {}) {
  const accompaniedCompetitorId = options.accompaniedCompetitorId || ''

  if (kind === 'participante' || kind === 'competidor') {
    return { category: 'competidor' }
  }
  if (kind === 'publico_preferencial') {
    return {
      category: 'publico_preferencial',
      seatType: 'preferencial',
      accompaniedCompetitorId,
    }
  }
  if (kind === 'publico_general') {
    return {
      category: 'publico_general',
      seatType: 'general',
      accompaniedCompetitorId,
    }
  }
  if (kind === 'asistente') {
    const seat = options.seatType || ''
    if (seat === 'preferencial') {
      return {
        category: 'publico_preferencial',
        seatType: 'preferencial',
        accompaniedCompetitorId,
      }
    }
    if (seat === 'general') {
      return {
        category: 'publico_general',
        seatType: 'general',
        accompaniedCompetitorId,
      }
    }
    return { category: '', seatType: '', accompaniedCompetitorId }
  }
  if (kind === 'patrocinador') {
    return { category: 'patrocinador', plan: options.plan || '' }
  }
  if (kind === 'expositor') {
    return {
      category: 'expositor',
      standType: options.standType || '',
    }
  }
  if (kind === 'unificado') {
    return {
      category: options.category || '',
      seatType: options.seatType || '',
      standType: options.standType || '',
      plan: options.plan || '',
      accompaniedCompetitorId,
    }
  }
  return { category: '', accompaniedCompetitorId }
}

export default function App() {
  const [registerOpen, setRegisterOpen] = useState(null)

  useEffect(() => {
    playSharkySound()
    return installSharkySoundOnFirstGesture()
  }, [])

  const openRegister = useCallback((kind = 'unificado', options = {}) => {
    setRegisterOpen(resolveRegisterOpen(kind, options))
  }, [])

  const closeRegister = useCallback(() => {
    setRegisterOpen(null)
  }, [])

  return (
    <>
      <Navbar onRegister={openRegister} />
      <main>
        <Hero onRegister={openRegister} />
        {/* <Ventures /> */}
        {/* <PitchRound /> */}
        <FinalRound onRegister={openRegister} />
        <Judges />
        <Sponsors onRegister={openRegister} />
        <MuestraComercial onRegister={openRegister} />
        <Prizes />
        {/* <Competition onRegister={openRegister} /> */}
        <Entradas onRegister={openRegister} />
        <News />
        <About />
        {/* <Editions /> */}
        {/* <Testimonials /> */}
        <InstagramFeed />
        <Gallery />
        {/* <Contact /> */}
      </main>
      <Allies />
      <Footer />
      {registerOpen && (
        <UnifiedRegisterModal
          onClose={closeRegister}
          initialCategory={registerOpen.category || ''}
          initialSeatType={registerOpen.seatType || ''}
          initialStandType={registerOpen.standType || ''}
          initialPlan={registerOpen.plan || ''}
          initialAccompaniedCompetitorId={
            registerOpen.accompaniedCompetitorId || ''
          }
        />
      )}
    </>
  )
}
