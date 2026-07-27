/* ============================================================
   CLIENTE DE SUPABASE
   Las credenciales vienen de .env.local (ver .env.example).
   ============================================================ */

import { createClient } from '@supabase/supabase-js'

/* Acepta ambos esquemas de nombres (los antiguos y los VITE_PUBLIC_*). */
const url =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/* Si falta la configuración avisamos en consola en vez de reventar,
   para que el sitio siga navegable mientras se configura. */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Shark Caribe] Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY ' +
      'en .env.local. El formulario de inscripción no podrá enviar datos.'
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

/* ------------------------------------------------------------
   AUTENTICACIÓN (panel de administración)
   Los usuarios se crean desde el panel de Supabase (Authentication).
   No hay registro público de administradores.
   ------------------------------------------------------------ */

export async function signIn(email, password) {
  if (!supabase) {
    throw new Error(
      'El inicio de sesión no está disponible: falta configurar Supabase (.env.local).'
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (error.message?.toLowerCase().includes('invalid login credentials')) {
      throw new Error('Correo o contraseña incorrectos.')
    }
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      throw new Error('Tu correo aún no está confirmado. Revisa tu bandeja de entrada.')
    }
    throw new Error('No pudimos iniciar sesión. Inténtalo de nuevo.')
  }

  return data
}

export async function signUp(email, password) {
  if (!supabase) {
    throw new Error(
      'El registro no está disponible: falta configurar Supabase (.env.local).'
    )
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    const msg = error.message?.toLowerCase() || ''
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      throw new Error('Ya existe una cuenta con ese correo.')
    }
    if (msg.includes('password')) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.')
    }
    if (msg.includes('signups not allowed') || msg.includes('sign-ups')) {
      throw new Error('El registro está desactivado. Pídele acceso a un administrador.')
    }
    throw new Error('No pudimos crear la cuenta. Inténtalo de nuevo.')
  }

  /* data.session existe si NO se requiere confirmación por correo;
     si es null, Supabase envió un correo de confirmación. */
  return data
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

/* Lee las inscripciones de competidores (requiere sesión + política RLS
   de SELECT para usuarios autenticados en la tabla). */
export async function fetchCompetitorRegistrations() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
    .from('competitor_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Shark Caribe] Error al leer inscripciones:', error)
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error(
        'No tienes permiso para ver las inscripciones. Falta una política RLS de ' +
          'lectura (SELECT) para usuarios autenticados en la tabla competitor_registrations.'
      )
    }
    const detail = [error.message, error.code].filter(Boolean).join(' · ')
    throw new Error(
      detail
        ? `No pudimos cargar las inscripciones: ${detail}`
        : 'No pudimos cargar las inscripciones. Inténtalo de nuevo.'
    )
  }

  return Array.isArray(data) ? data : []
}

/* Confirma pago: status → pago + guarda el código en payment_confirmation.
   Requiere política RLS de UPDATE para authenticated. */
export async function confirmCompetitorPayment(id, paymentCode) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const code = String(paymentCode || '').trim()
  if (!id) throw new Error('Falta el id de la inscripción.')
  if (!code) throw new Error('Escribe el código de pago.')

  const { data, error } = await supabase
    .from('competitor_registrations')
    .update({
      status: 'pago',
      payment_confirmation: code,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id, status, payment_confirmation, reviewed_at, updated_at')
    .maybeSingle()

  if (error) {
    console.error('[Shark Caribe] Error al confirmar pago:', error)
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error(
        'No tienes permiso para actualizar inscripciones. Falta una política RLS de ' +
          'UPDATE para usuarios autenticados en competitor_registrations.'
      )
    }
    if (error.code === '22P02' || error.message?.includes('pago')) {
      throw new Error(
        'El estado "pago" no existe en el enum registration_status. ' +
          'Agrégalo en Supabase con ALTER TYPE … ADD VALUE.'
      )
    }
    const detail = [error.message, error.code].filter(Boolean).join(' · ')
    throw new Error(detail || 'No pudimos confirmar el pago. Inténtalo de nuevo.')
  }

  if (!data) {
    throw new Error(
      'No se actualizó la inscripción. Puede que ya no esté en estado pendiente.'
    )
  }

  return data
}

/* ------------------------------------------------------------
   Traduce los errores de Postgres a mensajes que pueda leer
   un emprendedor, no un desarrollador.
   ------------------------------------------------------------ */
function friendlyError(error) {
  /* Las excepciones que lanzamos a mano en el trigger ya vienen
     escritas en español (ej. "Con 47 años la categoría..."). */
  if (error.code === 'P0001' && error.message) return error.message

  if (error.code === '23505') {
    return 'Ya existe una inscripción con ese correo o ese número de documento.'
  }

  if (error.code === '23514') {
    return 'Alguno de los datos no cumple el formato esperado. Revisa el formulario e inténtalo de nuevo.'
  }

  if (error.code === '42501') {
    return 'No se pudo guardar la inscripción por un problema de permisos. Escríbenos y lo resolvemos.'
  }

  return 'No pudimos guardar tu inscripción. Revisa tu conexión e inténtalo de nuevo.'
}

/* ------------------------------------------------------------
   Inserta una postulación de competidor.

   Nota: NO se encadena .select() a propósito. La tabla no tiene
   política de lectura para el rol anon (los datos personales no
   son públicos), así que pedir la fila de vuelta daría error.
   ------------------------------------------------------------ */
export async function submitCompetitorRegistration(values) {
  if (!supabase) {
    throw new Error(
      'El formulario todavía no está conectado a la base de datos. Escríbenos y te inscribimos manualmente.'
    )
  }

  const row = {
    accepted_terms: values.acceptedTerms,
    full_name: values.fullName.trim(),
    document_type: values.documentType,
    document_number: values.documentNumber.trim(),
    birth_date: values.birthDate,
    category: values.category,
    preferred_contact: values.preferredContact,
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    venture_name: values.ventureName.trim(),
    sector: values.sector,
    problem_solved: values.problemSolved.trim(),
    referral_source: values.referralSource,
    referral_source_other:
      values.referralSource === 'other' ? values.referralSourceOther.trim() : null,
  }

  const { error } = await supabase.from('competitor_registrations').insert(row)

  if (error) {
    console.error('[Shark Caribe] Error al inscribir:', error)
    throw new Error(friendlyError(error))
  }
}
