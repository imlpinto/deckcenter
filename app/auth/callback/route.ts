import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase redirige aquí después de que el usuario autoriza con Google
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Asegurar que el perfil tenga user_type seteado (para usuarios de Google)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ user_type: 'buyer' })
          .eq('id', user.id)
          .is('user_type', null) // solo si aún no tiene tipo asignado
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent('Error al autenticar con Google. Intenta de nuevo.')}`
  )
}
