import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Package, MessageCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Vendedores — TCGMarket',
  description: 'Conoce a los vendedores verificados de TCGMarket. Cartas TCG con precios competitivos.',
}

export default async function VendedoresPage() {
  const supabase = await createClient()

  // Vendedores con al menos 1 carta activa, con conteo de inventario
  const { data: sellers } = await supabase
    .from('profiles')
    .select(`
      id, full_name, store_name, store_slug, whatsapp, location, user_type,
      inventory!inner ( id )
    `)
    .in('user_type', ['seller', 'both'])
    .eq('inventory.is_active', true)
    .gt('inventory.quantity', 0)

  // Agrupar para evitar duplicados (Supabase devuelve una fila por cada item de inventory)
  const uniqueSellers = Object.values(
    ((sellers ?? []) as unknown as Array<{
      id: string
      full_name: string | null
      store_name: string | null
      store_slug: string | null
      whatsapp: string | null
      location: string | null
      user_type: string
      inventory: { id: string }[]
    }>).reduce<Record<string, {
      id: string
      full_name: string | null
      store_name: string | null
      store_slug: string | null
      whatsapp: string | null
      location: string | null
      cardCount: number
    }>>((acc, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          full_name: row.full_name,
          store_name: row.store_name,
          store_slug: row.store_slug,
          whatsapp: row.whatsapp,
          location: row.location,
          cardCount: row.inventory?.length ?? 0,
        }
      } else {
        acc[row.id].cardCount += (row.inventory?.length ?? 0)
      }
      return acc
    }, {})
  ).sort((a, b) => b.cardCount - a.cardCount)

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Vendedores</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {uniqueSellers.length > 0
            ? `${uniqueSellers.length} vendedor${uniqueSellers.length !== 1 ? 'es' : ''} activo${uniqueSellers.length !== 1 ? 's' : ''} en la plataforma`
            : 'Aún no hay vendedores registrados'}
        </p>
      </div>

      {/* Empty state */}
      {uniqueSellers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20 text-center">
          <Search className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="font-medium">Aún no hay vendedores</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            ¿Tienes cartas para vender? ¡Sé el primero!
          </p>
          <Link href="/auth/registro">
            <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300">
              Registrarme como vendedor
            </Button>
          </Link>
        </div>
      )}

      {/* Grid de vendedores */}
      {uniqueSellers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueSellers.map((seller) => {
            const displayName = seller.store_name ?? seller.full_name ?? 'Vendedor'
            const whatsappUrl = seller.whatsapp
              ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${displayName}! Vi tu perfil en TCGMarket 🃏`)}`
              : null

            return (
              <div
                key={seller.id}
                className="rounded-xl border border-border/40 bg-card/50 p-5 flex flex-col gap-4 hover:border-yellow-400/30 transition-all"
              >
                {/* Top */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 border border-yellow-400/20">
                    <span className="text-lg font-bold text-yellow-400">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{displayName}</p>
                    {seller.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {seller.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Package className="h-3 w-3" />
                    {seller.cardCount} carta{seller.cardCount !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-auto">
                  {seller.store_slug && (
                    <Link href={`/vendedor/${seller.store_slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver perfil
                      </Button>
                    </Link>
                  )}
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={seller.store_slug ? '' : 'flex-1'}>
                      <Button
                        size="sm"
                        className={`bg-green-600 hover:bg-green-500 text-white gap-1.5 ${!seller.store_slug ? 'w-full' : ''}`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
