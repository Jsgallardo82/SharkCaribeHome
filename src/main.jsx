import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import Admin from './components/Admin.jsx'
import Jury from './components/Jury.jsx'
import LiveRound2Results from './components/LiveRound2Results.jsx'
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
        <Route path="/resultados-vivo" element={<LiveRound2Results />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>,
)
