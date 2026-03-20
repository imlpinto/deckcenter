'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
