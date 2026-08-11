/* ============================================================
   CLIENTE DE SUPABASE
   Las credenciales vienen de .env.local (ver .env.example).
   ============================================================ */

import { createClient } from '@supabase/supabase-js'
import { isCompetitorRegistrationOpen } from '../data/content.js'

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

/* Crea el perfil si no existe (role por default en DB: concursante).
   Primero lee; solo inserta si falta. Evita upsert: muchas políticas RLS
   permiten SELECT del propio perfil pero no INSERT/UPDATE, y un upsert
   falla con 403 aunque la fila ya exista (el caso típico de un admin). */
export async function ensureProfile() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const session = await getSession()
  if (!session?.user) throw new Error('No hay sesión activa.')

  const existing = await getProfile()
  if (existing) return existing

  const { id, email } = session.user
  const { error } = await supabase.from('profiles').insert({
    id,
    email: (email || '').trim().toLowerCase(),
  })

  /* 23505 = unique_violation: otra sesión/trigger ya lo creó. */
  if (error && error.code !== '23505') {
    console.error('[Shark Caribe] Error al asegurar perfil:', error)
    if (error.code === '42501' || error.code === 'PGRST301' || error.status === 403) {
      throw new Error(
        'No tienes permiso para crear tu perfil. En Supabase, agrega una política RLS de ' +
          'INSERT en profiles para usuarios autenticados (id = auth.uid()), ' +
          'o crea el perfil manualmente / con un trigger en auth.users.'
      )
    }
    throw new Error('No pudimos preparar tu perfil de usuario.')
  }

  return getProfile()
}

export async function getProfile() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const session = await getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('[Shark Caribe] Error al leer perfil:', error)
    throw new Error('No pudimos leer tu perfil de usuario.')
  }

  return data
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

export async function fetchAttendeeRegistrations() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
    .from('attendee_registrations')
    .select(
      '*, accompanied:competitor_registrations(full_name, venture_name)'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Shark Caribe] Error al leer asistentes:', error)
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error(
        'No tienes permiso para ver asistentes. Revisa la política RLS de ' +
          'SELECT en attendee_registrations (rol admin).'
      )
    }
    const detail = [error.message, error.code].filter(Boolean).join(' · ')
    throw new Error(
      detail
        ? `No pudimos cargar los asistentes: ${detail}`
        : 'No pudimos cargar los asistentes. Inténtalo de nuevo.'
    )
  }

  return Array.isArray(data) ? data : []
}

export async function fetchSponsorRegistrations() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
    .from('sponsor_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Shark Caribe] Error al leer patrocinadores:', error)
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error(
        'No tienes permiso para ver patrocinadores. Revisa la política RLS de ' +
          'SELECT en sponsor_registrations (rol admin).'
      )
    }
    const detail = [error.message, error.code].filter(Boolean).join(' · ')
    throw new Error(
      detail
        ? `No pudimos cargar los patrocinadores: ${detail}`
        : 'No pudimos cargar los patrocinadores. Inténtalo de nuevo.'
    )
  }

  return Array.isArray(data) ? data : []
}

export async function fetchExhibitorRegistrations() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
    .from('exhibitor_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Shark Caribe] Error al leer expositores:', error)
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error(
        'No tienes permiso para ver expositores. Revisa la política RLS de ' +
          'SELECT en exhibitor_registrations (rol admin).'
      )
    }
    const detail = [error.message, error.code].filter(Boolean).join(' · ')
    throw new Error(
      detail
        ? `No pudimos cargar los expositores: ${detail}`
        : 'No pudimos cargar los expositores. Inténtalo de nuevo.'
    )
  }

  return Array.isArray(data) ? data : []
}

/* Confirma pago: status → pago + guarda el código en payment_confirmation.
   Requiere política RLS de UPDATE para admin autenticado. */
async function confirmRegistrationPayment(table, id, paymentCode) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const code = String(paymentCode || '').trim()
  if (!id) throw new Error('Falta el id de la inscripción.')
  if (!code) throw new Error('Escribe el código de pago.')

  const { data, error } = await supabase
    .from(table)
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
    console.error(`[Shark Caribe] Error al confirmar pago (${table}):`, error)
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error(
        'No tienes permiso para actualizar inscripciones. Revisa la política RLS de ' +
          `UPDATE para admin en ${table}.`
      )
    }
    if (error.code === '22P02' || error.message?.includes('pago')) {
      throw new Error(
        'El estado "pago" no es válido en esta tabla. Revisa el constraint/enum de status.'
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

export async function confirmCompetitorPayment(id, paymentCode) {
  return confirmRegistrationPayment('competitor_registrations', id, paymentCode)
}

/* Actualiza avance en competencia + logo + motivo de rechazo (admin). */
export async function updateCompetitorProgress(id, values) {
  if (!supabase) throw new Error('Supabase no está configurado.')
  if (!id) throw new Error('Falta el id de la inscripción.')

  const stage = String(values.competitionStage || '').trim()
  if (!stage) throw new Error('Selecciona una etapa de competencia.')

  const rejectionReason = String(values.rejectionReason || '').trim()
  if (stage === 'rechazado' && !rejectionReason) {
    throw new Error('Escribe el motivo de rechazo.')
  }

  const logoUrl = String(values.logoUrl || '').trim()

  const { data, error } = await supabase
    .from('competitor_registrations')
    .update({
      competition_stage: stage,
      logo_url: logoUrl || null,
      rejection_reason: stage === 'rechazado' ? rejectionReason : null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, competition_stage, logo_url, rejection_reason, reviewed_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    console.error('[Shark Caribe] Error al actualizar avance:', error)
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error(
        'No tienes permiso para actualizar competidores. Revisa la política RLS de UPDATE.'
      )
    }
    if (error.code === '22P02') {
      throw new Error(
        'La etapa no es válida. Ejecuta el SQL de competitor_competition_stage en Supabase.'
      )
    }
    const detail = [error.message, error.code].filter(Boolean).join(' · ')
    throw new Error(detail || 'No pudimos guardar el avance. Inténtalo de nuevo.')
  }

  if (!data) {
    throw new Error('No se actualizó la inscripción. Verifica que el registro exista.')
  }

  return data
}

export async function confirmAttendeePayment(id, paymentCode) {
  return confirmRegistrationPayment('attendee_registrations', id, paymentCode)
}

export async function confirmSponsorPayment(id, paymentCode) {
  return confirmRegistrationPayment('sponsor_registrations', id, paymentCode)
}

export async function confirmExhibitorPayment(id, paymentCode) {
  return confirmRegistrationPayment('exhibitor_registrations', id, paymentCode)
}

/* ------------------------------------------------------------
   Traduce los errores de Postgres a mensajes que pueda leer
   un emprendedor, no un desarrollador.
   ------------------------------------------------------------ */
function friendlyError(error) {
  /* Las excepciones que lanzamos a mano en el trigger ya vienen
     escritas en español (ej. "Con 47 años la categoría..."). */
  if (error.code === 'P0001' && error.message) return error.message

  const msg = String(error.message || '')
  if (/convocatoria.*cerr/i.test(msg)) {
    return 'La convocatoria de competidores ya cerró.'
  }

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

const LOGO_BUCKET = 'logos'
const LOGO_MAX_BYTES = 2 * 1024 * 1024
const LOGO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function sanitizeLogoFileName(name) {
  return String(name || 'logo')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'logo'
}

function extensionForLogo(file) {
  const fromName = String(file.name || '').split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

/* Sube el logo al bucket público y devuelve la URL pública. */
export async function uploadCompetitorLogo(file) {
  if (!supabase) {
    throw new Error(
      'El formulario todavía no está conectado a la base de datos. Escríbenos y te inscribimos manualmente.'
    )
  }
  if (!file) return null

  if (!LOGO_MIME.has(file.type)) {
    throw new Error('El logo debe ser una imagen JPG, PNG, WEBP o GIF.')
  }
  if (file.size > LOGO_MAX_BYTES) {
    throw new Error('El logo no puede superar 2 MB.')
  }

  const ext = extensionForLogo(file)
  const stamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const base = sanitizeLogoFileName(file.name.replace(/\.[^.]+$/, ''))
  const path = `competidores/${stamp}-${random}-${base}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    console.error('[Shark Caribe] Error al subir logo:', uploadError)
    if (
      uploadError.message?.includes('Bucket not found') ||
      uploadError.message?.includes('not found')
    ) {
      throw new Error(
        'El almacenamiento de logos aún no está configurado. Ejecuta logos_bucket.sql en Supabase.'
      )
    }
    throw new Error(
      'No pudimos subir el logo. Revisa el archivo e inténtalo de nuevo.'
    )
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return data?.publicUrl || null
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

  if (!isCompetitorRegistrationOpen()) {
    throw new Error('La convocatoria de competidores ya cerró.')
  }

  let logoUrl = null
  if (values.logoFile) {
    logoUrl = await uploadCompetitorLogo(values.logoFile)
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
    logo_url: logoUrl,
  }

  const { error } = await supabase.from('competitor_registrations').insert(row)

  if (error) {
    console.error('[Shark Caribe] Error al inscribir:', error)
    throw new Error(friendlyError(error))
  }
}

/* Emprendedores con pago confirmado (vista pública, sin PII sensible). */
export async function fetchPublicCompetitors() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('public_competitors')
    .select('id, full_name, venture_name')
    .order('venture_name', { ascending: true })

  if (error) {
    console.error('[Shark Caribe] Error al listar emprendedores públicos:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

function mapPublicVentureRow(row) {
  return {
    id: row.id,
    name: row.venture_name || 'Emprendimiento',
    sector: row.sector || '',
    logo: row.logo_url || '',
    stage: row.competition_stage || 'aprobado',
  }
}

/**
 * Emprendimientos para la sección pública Ventures.
 * Ideal: vista public_competitors con sector, logo_url y competition_stage
 * (supabase/public_competitors_ventures.sql).
 * Si la vista aún es la antigua, hace fallback a columnas básicas.
 */
export async function fetchPublicVentures() {
  if (!supabase) return []

  const full = await supabase
    .from('public_competitors')
    .select('id, venture_name, sector, logo_url, competition_stage')
    .order('venture_name', { ascending: true })

  if (!full.error && Array.isArray(full.data)) {
    return full.data.map(mapPublicVentureRow)
  }

  console.warn(
    '[Shark Caribe] Vista public_competitors incompleta. ' +
      'Ejecuta supabase/public_competitors_ventures.sql. Detalle:',
    {
      message: full.error?.message,
      code: full.error?.code,
      details: full.error?.details,
      hint: full.error?.hint,
    }
  )

  const basic = await supabase
    .from('public_competitors')
    .select('id, venture_name')
    .order('venture_name', { ascending: true })

  if (basic.error) {
    console.error('[Shark Caribe] Error al listar emprendimientos públicos:', {
      message: basic.error.message,
      code: basic.error.code,
      details: basic.error.details,
      hint: basic.error.hint,
    })
    return []
  }

  if (!Array.isArray(basic.data)) return []
  return basic.data.map(mapPublicVentureRow)
}

export async function submitAttendeeRegistration(values) {
  if (!supabase) {
    throw new Error(
      'El formulario todavía no está conectado a la base de datos. Escríbenos y te inscribimos manualmente.'
    )
  }

  const row = {
    full_name: values.fullName.trim(),
    document_type: values.documentType,
    document_number: values.documentNumber.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    profile: values.profile,
    organization: values.organization.trim() || null,
    interest: values.interest,
    seat_type: values.seatType,
    accompanied_competitor_id: values.accompaniedCompetitorId || null,
    referral_source: values.referralSource,
    referral_source_other:
      values.referralSource === 'other' ? values.referralSourceOther.trim() : null,
  }

  const { error } = await supabase.from('attendee_registrations').insert(row)

  if (error) {
    console.error('[Shark Caribe] Error al inscribir asistente:', error)
    throw new Error(friendlyError(error))
  }
}

/**
 * Registra al asistente y obtiene params firmados para el Widget Wompi.
 * Usa RPC de Postgres (evita CloudFront 403 en /functions/v1 desde el browser).
 */
export async function createAttendeeWompiCheckout(values) {
  if (!supabase) {
    throw new Error(
      'El formulario todavía no está conectado a la base de datos. Escríbenos y te inscribimos manualmente.'
    )
  }

  const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY
  if (!publicKey) {
    throw new Error(
      'Falta VITE_WOMPI_PUBLIC_KEY en .env.local. Sin ella no se puede abrir el checkout.'
    )
  }

  const payload = {
    fullName: values.fullName,
    documentType: values.documentType,
    documentNumber: values.documentNumber,
    email: values.email,
    phone: values.phone,
    profile: values.profile,
    organization: values.organization,
    interest: values.interest,
    seatType: values.seatType,
    accompaniedCompetitorId: values.accompaniedCompetitorId || null,
    referralSource: values.referralSource,
    referralSourceOther: values.referralSourceOther,
  }

  const redirectOrigin =
    typeof window !== 'undefined' ? window.location.origin : null

  console.info('[Shark Caribe][Wompi] Invocando RPC create_attendee_wompi_checkout…', {
    seatType: payload.seatType,
    email: payload.email,
    origin: redirectOrigin,
  })

  const { data, error } = await supabase.rpc('create_attendee_wompi_checkout', {
    payload,
  })

  if (error) {
    console.error('[Shark Caribe][Wompi] Falló RPC checkout', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(
      error.message || 'No pudimos iniciar el pago. Inténtalo de nuevo.'
    )
  }

  if (!data?.reference || !data?.signatureIntegrity) {
    console.error('[Shark Caribe][Wompi] Respuesta incompleta:', data)
    throw new Error('La respuesta de pago está incompleta. Inténtalo de nuevo.')
  }

  const checkout = {
    ...data,
    publicKey,
    redirectUrl: redirectOrigin ? `${redirectOrigin}/pago/resultado` : null,
    customerData: data.customerData || undefined,
  }

  console.info('[Shark Caribe][Wompi] Checkout listo (RPC)', {
    registrationId: checkout.registrationId,
    reference: checkout.reference,
    amountInCents: checkout.amountInCents,
    redirectUrl: checkout.redirectUrl,
  })

  return checkout
}

export async function submitSponsorRegistration(values) {
  if (!supabase) {
    throw new Error(
      'El formulario todavía no está conectado a la base de datos. Escríbenos y te inscribimos manualmente.'
    )
  }

  const row = {
    company_name: values.companyName.trim(),
    tax_id: values.taxId.trim(),
    contact_name: values.contactName.trim(),
    contact_role: values.contactRole.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    website: values.website.trim() || null,
    plan: values.plan,
    sector: values.sector.trim(),
    comments: values.comments.trim() || null,
    referral_source: values.referralSource,
    referral_source_other:
      values.referralSource === 'other' ? values.referralSourceOther.trim() : null,
  }

  const { error } = await supabase.from('sponsor_registrations').insert(row)

  if (error) {
    console.error('[Shark Caribe] Error al inscribir patrocinador:', error)
    throw new Error(friendlyError(error))
  }
}

export async function submitExhibitorRegistration(values) {
  if (!supabase) {
    throw new Error(
      'El formulario todavía no está conectado a la base de datos. Escríbenos y te inscribimos manualmente.'
    )
  }

  const row = {
    company_name: values.companyName.trim(),
    tax_id: values.taxId.trim(),
    contact_name: values.contactName.trim(),
    contact_role: values.contactRole.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    website: values.website.trim() || null,
    stand_type: values.standType,
    sector: values.sector.trim(),
    comments: values.comments.trim() || null,
    referral_source: values.referralSource,
    referral_source_other:
      values.referralSource === 'other' ? values.referralSourceOther.trim() : null,
  }

  const { error } = await supabase.from('exhibitor_registrations').insert(row)

  if (error) {
    console.error('[Shark Caribe] Error al inscribir expositor:', error)
    throw new Error(friendlyError(error))
  }
}
