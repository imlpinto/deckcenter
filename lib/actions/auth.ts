'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const { error, data } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('full_name') as string },
    },
  })

  if (error) {
    redirect(`/auth/registro?error=${encodeURIComponent(error.message)}`)
  }

  // Actualizar el perfil con datos extra (el trigger ya crea la fila base)
  if (data.user) {
    await supabase
      .from('profiles')
      .update({
        whatsapp: formData.get('whatsapp') as string,
        user_type: formData.get('user_type') as string,
        store_name: formData.get('full_name') as string,
      })
      .eq('id', data.user.id)
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
