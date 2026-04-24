import Link from 'next/link'
import { Zap } from 'lucide-react'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleButton } from '@/components/auth/google-button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 mb-3">
            <Zap className="h-6 w-6 text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold">Bienvenido de vuelta</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresa a tu cuenta Deckcenter</p>
        </div>

        {/* Google OAuth */}
        <GoogleButton redirectTo={params.redirectTo ?? '/dashboard'} />

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">o continúa con email</span>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4">
          {/* Hidden redirect */}
          {params.redirectTo && (
            <input type="hidden" name="redirectTo" value={params.redirectTo} />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/auth/recuperar" className="text-xs text-muted-foreground hover:text-foreground">
                ¿Olvidaste la contraseña?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {params.error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {params.error}
            </p>
          )}

          <Button formAction={login} className="w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300">
            Ingresar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/registro" className="text-yellow-400 hover:text-yellow-300 font-medium">
            Regístrate gratis
          </Link>
        </p>

      </div>
    </div>
  )
}
