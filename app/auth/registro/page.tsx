import Link from 'next/link'
import { Zap } from 'lucide-react'
import { register } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleButton } from '@/components/auth/google-button'

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
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
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground mt-1">Empieza a vender tus cartas hoy</p>
        </div>

        {/* Google OAuth */}
        <GoogleButton label="Registrarse con Google" />

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">o regístrate con email</span>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4">

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre / Apodo</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Ej: Juan Cartas"
              required
            />
          </div>

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
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">
              WhatsApp{' '}
              <span className="text-muted-foreground font-normal">(con código de país)</span>
            </Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              placeholder="+573001234567"
            />
          </div>

          {/* Tipo de usuario */}
          <div className="space-y-1.5">
            <Label>Tipo de cuenta</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'seller', label: 'Vendedor' },
                { value: 'both', label: 'Vendo y compro' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 cursor-pointer hover:border-yellow-400/40 has-[:checked]:border-yellow-400 has-[:checked]:bg-yellow-400/10 transition-colors"
                >
                  <input
                    type="radio"
                    name="user_type"
                    value={opt.value}
                    defaultChecked={opt.value === 'seller'}
                    className="accent-yellow-400"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {params.error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {params.error}
            </p>
          )}

          <Button formAction={register} className="w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300">
            Crear cuenta gratis
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Al registrarte aceptas nuestros{' '}
            <Link href="/terminos" className="underline underline-offset-4 hover:text-foreground">
              Términos de Uso
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300 font-medium">
            Ingresar
          </Link>
        </p>

      </div>
    </div>
  )
}
