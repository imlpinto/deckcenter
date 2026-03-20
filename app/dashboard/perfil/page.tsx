import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Mi Perfil' }

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-xl space-y-8">

      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Completa tu perfil para que los compradores puedan contactarte
        </p>
      </div>

      {/* Alertas */}
      {params.success && (
        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Perfil actualizado correctamente
        </div>
      )}
      {params.error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {params.error}
        </p>
      )}

      {/* WhatsApp — aviso si falta */}
      {!profile?.whatsapp && (
        <div className="flex items-start gap-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30 p-4">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-yellow-400">WhatsApp requerido</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sin número de WhatsApp los compradores no podrán contactarte desde el botón de checkout.
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form className="space-y-5">

        {/* Nombre */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile?.full_name ?? ''}
            placeholder="Tu nombre o apodo"
            required
          />
        </div>

        {/* Nombre de tienda */}
        <div className="space-y-1.5">
          <Label htmlFor="store_name">
            Nombre de tienda / perfil
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              (aparece en tu perfil público)
            </span>
          </Label>
          <Input
            id="store_name"
            name="store_name"
            defaultValue={profile?.store_name ?? ''}
            placeholder="Ej: CardsStore Bogotá"
          />
        </div>

        {/* URL del perfil */}
        <div className="space-y-1.5">
          <Label htmlFor="store_slug">
            URL de tu perfil
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              (opcional, se genera automáticamente)
            </span>
          </Label>
          <div className="flex rounded-md overflow-hidden border border-input">
            <span className="flex items-center px-3 bg-muted text-xs text-muted-foreground border-r border-input whitespace-nowrap">
              /vendedor/
            </span>
            <Input
              id="store_slug"
              name="store_slug"
              defaultValue={profile?.store_slug ?? ''}
              placeholder="mi-tienda"
              className="rounded-none border-0 focus-visible:ring-0"
            />
          </div>
          {profile?.store_slug && (
            <Link
              href={`/vendedor/${profile.store_slug}`}
              className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300"
              target="_blank"
            >
              Ver mi perfil público
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">
            WhatsApp
            <Badge className="ml-2 bg-green-600/20 text-green-400 border-green-600/30 text-[10px]">
              Importante
            </Badge>
          </Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            defaultValue={profile?.whatsapp ?? ''}
            placeholder="+573001234567"
          />
          <p className="text-xs text-muted-foreground">
            Incluye el código de país. Ej: Colombia → +57, México → +52
          </p>
        </div>

        {/* Ubicación */}
        <div className="space-y-1.5">
          <Label htmlFor="location">Ciudad / Región</Label>
          <Input
            id="location"
            name="location"
            defaultValue={profile?.location ?? ''}
            placeholder="Ej: Bogotá, Colombia"
          />
        </div>

        {/* Tipo de usuario */}
        <div className="space-y-2">
          <Label>Tipo de cuenta</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'buyer', label: 'Solo compro' },
              { value: 'seller', label: 'Solo vendo' },
              { value: 'both', label: 'Compro y vendo' },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 cursor-pointer hover:border-yellow-400/40 has-[:checked]:border-yellow-400 has-[:checked]:bg-yellow-400/10 transition-colors"
              >
                <input
                  type="radio"
                  name="user_type"
                  value={opt.value}
                  defaultChecked={profile?.user_type === opt.value}
                  className="accent-yellow-400"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Email (solo lectura) */}
        <div className="space-y-1.5">
          <Label>Correo electrónico</Label>
          <Input
            value={user?.email ?? ''}
            readOnly
            className="bg-muted/30 text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">El email no se puede cambiar desde aquí</p>
        </div>

        <Button
          formAction={updateProfile}
          className="w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300"
        >
          Guardar cambios
        </Button>
      </form>

    </div>
  )
}
