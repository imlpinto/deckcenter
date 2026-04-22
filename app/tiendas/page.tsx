import type { Metadata } from 'next'
import { MapPin, Phone, Store, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Tiendas Aliadas — Deckcenter',
  description: 'Puntos de retiro y tiendas físicas aliadas a Deckcenter.',
}

export default async function TiendasPage() {
  const supabase = await createClient()

  const { data: tiendas } = await supabase
    .from('tiendas_aliadas')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Tiendas Aliadas</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Puntos de retiro físico y tiendas asociadas a la plataforma
        </p>
      </div>

      {/* Empty state */}
      {(!tiendas || tiendas.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20 text-center">
          <Store className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="font-medium">Próximamente</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Estamos incorporando tiendas aliadas como puntos de retiro seguros. ¿Tienes una tienda? Contáctanos.
          </p>
        </div>
      )}

      {/* Grid de tiendas */}
      {tiendas && tiendas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiendas.map((tienda) => (
            <div
              key={tienda.id}
              className="rounded-xl border border-border/40 bg-card/50 p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
                  <Store className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">{tienda.name}</p>
                  {tienda.city && (
                    <Badge variant="secondary" className="text-xs mt-1">{tienda.city}</Badge>
                  )}
                </div>
              </div>

              {/* Dirección */}
              {tienda.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {tienda.address}
                </p>
              )}

              {tienda.description && (
                <p className="text-sm text-muted-foreground">{tienda.description}</p>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                {tienda.maps_url && (
                  <a href={tienda.maps_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver en mapa
                    </Button>
                  </a>
                )}
                {tienda.whatsapp && (
                  <a
                    href={`https://wa.me/${tienda.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-500 text-white gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Contactar
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
