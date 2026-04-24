'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MAX_SIZE = 1024 * 1024 // 1 MB

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No se seleccionó ninguna imagen' }
  if (file.size > MAX_SIZE) return { error: 'La imagen no puede superar 1 MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadErr) return { error: uploadErr.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
    .eq('id', user.id)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/dashboard/perfil')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadTiendaLogo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const tiendaId = formData.get('tienda_id') as string
  if (!tiendaId) return { error: 'Tienda no especificada' }

  // Verificar que el usuario sea el manager de esta tienda
  const { data: tienda } = await supabase
    .from('tiendas_aliadas')
    .select('id')
    .eq('id', tiendaId)
    .eq('manager_id', user.id)
    .single()

  if (!tienda) return { error: 'No tienes permiso para editar esta tienda' }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'No se seleccionó ninguna imagen' }
  if (file.size > MAX_SIZE) return { error: 'La imagen no puede superar 1 MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `tiendas/${tiendaId}/logo.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadErr) return { error: uploadErr.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateErr } = await supabase
    .from('tiendas_aliadas')
    .update({ logo_url: `${publicUrl}?t=${Date.now()}` })
    .eq('id', tiendaId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/dashboard/perfil')
  revalidatePath('/tiendas')
  return { success: true }
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const storeName = (formData.get('store_name') as string).trim()
  const manualSlug = (formData.get('store_slug') as string).trim()
  const storeSlug = manualSlug || toSlug(storeName)

  // Verificar que el slug no esté en uso por otro usuario
  if (storeSlug) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('store_slug', storeSlug)
      .neq('id', user.id)
      .single()

    if (existing) {
      redirect(`/dashboard/perfil?error=${encodeURIComponent('Ese nombre de URL ya está en uso. Elige otro.')}`)
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: (formData.get('full_name') as string).trim(),
      whatsapp: (formData.get('whatsapp') as string).trim(),
      store_name: storeName,
      store_slug: storeSlug || null,
      location: (formData.get('location') as string).trim(),
      user_type: formData.get('user_type') as string,
    })
    .eq('id', user.id)

  if (error) {
    redirect(`/dashboard/perfil?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/perfil')
  revalidatePath('/dashboard')
  redirect('/dashboard/perfil?success=1')
}
