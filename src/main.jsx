import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import Admin from './components/Admin.jsx'
import Jury from './components/Jury.jsx'
import PaymentResult from './components/PaymentResult.jsx'
import './styles/theme.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
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
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>,
)
