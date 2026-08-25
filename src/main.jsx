import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './styles/theme.css'
import './styles/global.css'

const Login = lazy(() => import('./components/Login.jsx'))
const Signup = lazy(() => import('./components/Signup.jsx'))
const Admin = lazy(() => import('./components/Admin.jsx'))
const Jury = lazy(() => import('./components/Jury.jsx'))
const PaymentResult = lazy(() => import('./components/PaymentResult.jsx'))

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontFamily: 'inherit',
      }}
    >
      Cargando…
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/pago/resultado" element={<PaymentResult />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/jurado" element={<Jury />} />
          {/* Ranking en vivo desactivado: sin montaje ni polling */}
          <Route path="/resultados-vivo" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>,
)
