import Link from 'next/link'
import { Package, TrendingUp, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PublishCardButton } from '@/components/dashboard/publish-card-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Stats del vendedor
  const [inventoryRes, activeRes] = await Promise.all([
    supabase
      .from('inventory')
      .select('id, quantity, manual_price, use_market_price, is_active', { count: 'exact' })
      .eq('seller_id', user!.id),
    supabase
      .from('inventory')
      .select('id', { count: 'exact' })
      .eq('seller_id', user!.id)
      .eq('is_active', true),
  ])

  const totalItems = inventoryRes.count ?? 0
  const activeItems = activeRes.count ?? 0
  const totalQuantity = inventoryRes.data?.reduce((sum, i) => sum + (i.quantity ?? 0), 0) ?? 0

  // Últimas 5 cartas agregadas
  const { data: recentItems } = await supabase
    .from('inventory')
    .select(`
      id, quantity, condition, manual_price, use_market_price, is_active, updated_at,
      card:tcg_cards ( name, image_url_sm, set_name, market_price_usd )
    `)
    .eq('seller_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Cartas publicadas',
      value: activeItems,
      sub: `${totalItems} en total (incl. inactivas)`,
      icon: Package,
      color: 'text-yellow-400',
    },
    {
      title: 'Unidades disponibles',
      value: totalQuantity,
      sub: 'Stock total en tu inventario',
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      title: 'Visitas al perfil',
      value: '—',
      sub: 'Próximamente',
      icon: Eye,
      color: 'text-blue-400',
    },
  ]

  return (
    <div className="space-y-8 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resumen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tu inventario y sigue tus publicaciones
          </p>
        </div>
        <PublishCardButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card/60 border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actividad reciente */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Últimas actualizaciones</h2>
          <Link href="/dashboard/inventario">
            <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
              Ver todo
            </Button>
          </Link>
        </div>

        {!recentItems || recentItems.length === 0 ? (
          <EmptyInventory />
        ) : (
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Carta</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => {
                  const card = item.card as unknown as { name: string; set_name: string | null; market_price_usd: number | null } | null
                  const price = item.use_market_price
                    ? card?.market_price_usd
                    : item.manual_price
                  return (
                    <tr key={item.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[180px]">{card?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{card?.set_name ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={CONDITION_STYLE[item.condition as string] ?? ''}
                        >
                          {item.condition}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {price ? (
                          <span className="font-medium text-yellow-400">
                            ${price.toFixed(2)}
                            <span className="text-xs text-muted-foreground ml-1">USD</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

function EmptyInventory() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
      <Package className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="font-medium">Tu inventario está vacío</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Publica tu primera carta en menos de 2 minutos
      </p>
      <PublishCardButton variant="sm" />
    </div>
  )
}

const CONDITION_STYLE: Record<string, string> = {
  NM: 'border-green-400/40 text-green-400',
  LP: 'border-lime-400/40 text-lime-400',
  MP: 'border-yellow-400/40 text-yellow-400',
  HP: 'border-orange-400/40 text-orange-400',
  DMG: 'border-red-400/40 text-red-400',
}
