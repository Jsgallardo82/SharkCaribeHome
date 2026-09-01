import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
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
import Sponsors from './components/Sponsors.jsx'
// import Entradas from './components/Entradas.jsx'
import MuestraComercial from './components/MuestraComercial.jsx'
import News from './components/News.jsx'
import Allies from './components/Allies.jsx'
import Footer from './components/Footer.jsx'
import {
  installSharkySoundOnFirstGesture,
  playSharkySound,
} from './lib/sharkySound.js'

const InstagramFeed = lazy(() => import('./components/InstagramFeed.jsx'))
const Gallery = lazy(() => import('./components/Gallery.jsx'))
const UnifiedRegisterModal = lazy(
  () => import('./components/UnifiedRegisterModal.jsx'),
)

function normalizeSeatType(value) {
  const seat = String(value || '')
    .trim()
    .toLowerCase()
  if (seat === 'preferencial' || seat === 'pref') return 'preferencial'
  if (seat === 'general' || seat === 'gen') return 'general'
  return ''
}

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
  const deepLinkHandled = useRef(false)
  const { seatType: seatFromPath } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()

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

  // Deep link WhatsApp / compartir:
  //   /boleta/preferencial  /boleta/general
  //   /boleta?tipo=preferencial
  //   /?tipo=general
  useEffect(() => {
    if (deepLinkHandled.current) return

    const fromQuery =
      searchParams.get('tipo') ||
      searchParams.get('seat') ||
      searchParams.get('boleta')
    const seat = normalizeSeatType(seatFromPath || fromQuery)
    const onBoletaRoute = location.pathname.startsWith('/boleta')

    if (!seat && !onBoletaRoute) return

    deepLinkHandled.current = true

    if (seat) {
      openRegister('asistente', { seatType: seat })
    } else {
      openRegister('unificado', { category: '' })
    }

    const hero = document.getElementById('inicio')
    if (hero) {
      requestAnimationFrame(() => {
        hero.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [location.pathname, openRegister, searchParams, seatFromPath])

  return (
    <>
      <Navbar onRegister={openRegister} />
      <main>
        <Hero onRegister={openRegister} />
        <About />
        {/* <Ventures /> */}
        {/* <PitchRound /> */}
        <FinalRound onRegister={openRegister} />
        <Judges />
        <Sponsors onRegister={openRegister} />
        <MuestraComercial onRegister={openRegister} />
        <Prizes />
        {/* <Competition onRegister={openRegister} /> */}
        {/* <Entradas onRegister={openRegister} /> */}
        <News />
        {/* <Editions /> */}
        {/* <Testimonials /> */}
        <Suspense fallback={null}>
          <InstagramFeed />
          <Gallery />
        </Suspense>
        {/* <Contact /> */}
      </main>
      <Allies />
      <Footer />
      {registerOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </>
  )
}
