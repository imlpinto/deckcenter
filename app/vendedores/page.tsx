import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { SellerGrid } from '@/components/vendedores/seller-grid'

export const metadata: Metadata = {
  title: 'Vendedores — Deckcenter',
  description: 'Conoce a los vendedores verificados de Deckcenter. Cartas TCG con precios competitivos.',
}

export default async function VendedoresPage() {
  const supabase = await createClient()

  const { data: sellers } = await supabase
    .from('profiles')
    .select(`
      id, full_name, store_name, store_slug, whatsapp, location, user_type, avatar_url,
      inventory!inner ( id )
    `)
    .in('user_type', ['seller', 'both'])
    .eq('inventory.is_active', true)
    .gt('inventory.quantity', 0)

  const uniqueSellers = Object.values(
    ((sellers ?? []) as unknown as Array<{
      id: string
      full_name: string | null
      store_name: string | null
      store_slug: string | null
      whatsapp: string | null
      location: string | null
      user_type: string
      avatar_url: string | null
      inventory: { id: string }[]
    }>).reduce<Record<string, {
      id: string
      full_name: string | null
      store_name: string | null
      store_slug: string | null
      whatsapp: string | null
      location: string | null
      avatar_url: string | null
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
          avatar_url: row.avatar_url,
          cardCount: row.inventory?.length ?? 0,
        }
      } else {
        acc[row.id].cardCount += (row.inventory?.length ?? 0)
      }
      return acc
    }, {})
  ).sort((a, b) => b.cardCount - a.cardCount)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Vendedores</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {uniqueSellers.length > 0
            ? `${uniqueSellers.length} vendedor${uniqueSellers.length !== 1 ? 'es' : ''} activo${uniqueSellers.length !== 1 ? 's' : ''} en la plataforma`
            : 'Aún no hay vendedores registrados'}
        </p>
      </div>

      {/* Empty state global */}
      {uniqueSellers.length === 0 ? (
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
      ) : (
        <SellerGrid sellers={uniqueSellers} />
      )}

    </div>
  )
}
