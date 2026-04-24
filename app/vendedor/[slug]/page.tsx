import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, MessageCircle, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CardCondition } from '@/types'

// Helper inline para el WhatsApp directo desde perfil
function makeWhatsappUrl(whatsapp: string, storeName: string) {
  const phone = whatsapp.replace(/\D/g, '')
  const msg = `¡Hola ${storeName}! Vi tu perfil en Deckcenter y me interesa conocer tu inventario 🃏`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('store_name, full_name, location')
    .eq('store_slug', slug)
    .single()

  if (!data) return { title: 'Vendedor no encontrado' }
  const name = data.store_name ?? data.full_name ?? 'Vendedor'
  return {
    title: `${name} — Vendedor en Deckcenter`,
    description: `Compra cartas TCG a ${name}${data.location ? ` en ${data.location}` : ''}. Precios competitivos y checkout por WhatsApp.`,
  }
}

const CONDITION_COLOR: Record<string, string> = {
  NM: 'text-green-400 border-green-400/40',
  LP: 'text-lime-400 border-lime-400/40',
  MP: 'text-yellow-400 border-yellow-400/40',
  HP: 'text-orange-400 border-orange-400/40',
  DMG: 'text-red-400 border-red-400/40',
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Datos del vendedor
  const { data: seller } = await supabase
    .from('profiles')
    .select('id, full_name, store_name, store_slug, whatsapp, location, user_type, avatar_url')
    .eq('store_slug', slug)
    .single()

  if (!seller) notFound()

  // Inventario activo del vendedor con datos de carta
  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      id, quantity, condition, manual_price, use_market_price, notes,
      card:tcg_cards ( id, name, image_url_sm, set_name, card_number, rarity, market_price_usd )
    `)
    .eq('seller_id', seller.id)
    .eq('is_active', true)
    .gt('quantity', 0)
    .order('updated_at', { ascending: false })

  const items = (inventory ?? []) as unknown as Array<{
    id: string
    quantity: number
    condition: CardCondition
    manual_price: number | null
    use_market_price: boolean
    notes: string | null
    card: {
      id: string
      name: string
      image_url_sm: string | null
      set_name: string | null
      card_number: string | null
      rarity: string | null
      market_price_usd: number | null
    } | null
  }>

  const displayName = seller.store_name ?? seller.full_name ?? 'Vendedor'
  const whatsappUrl = seller.whatsapp ? makeWhatsappUrl(seller.whatsapp, displayName) : null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header del vendedor */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6">

        {/* Avatar */}
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl overflow-hidden bg-yellow-400/20 border border-yellow-400/30">
          {seller.avatar_url ? (
            <Image
              src={seller.avatar_url}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-yellow-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">{displayName}</h1>
            {seller.user_type !== 'buyer' && (
              <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 text-xs">
                Vendedor
              </Badge>
            )}
          </div>
          {seller.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {seller.location}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} carta{items.length !== 1 ? 's' : ''} disponible{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* CTA WhatsApp */}
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <Button className="bg-green-600 hover:bg-green-500 text-white gap-2">
              <MessageCircle className="h-4 w-4" />
              Contactar
            </Button>
          </a>
        )}
      </div>

      {/* Inventario */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Cartas disponibles</h2>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">Este vendedor no tiene cartas publicadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => {
              const card = item.card
              if (!card) return null
              const effectivePrice = item.use_market_price
                ? card.market_price_usd
                : item.manual_price

              // WhatsApp con mensaje específico para esta carta
              const itemWhatsappUrl = seller.whatsapp
                ? buildWhatsappForItem({
                    whatsapp: seller.whatsapp,
                    displayName,
                    cardName: card.name,
                    condition: item.condition,
                    priceUsd: effectivePrice,
                  })
                : null

              return (
                <div key={item.id} className="group rounded-xl border border-border/40 bg-card overflow-hidden hover:border-yellow-400/30 transition-all">
                  {/* Imagen */}
                  <Link href={`/carta/${card.id}`}>
                    <div className="relative aspect-[5/7] bg-muted overflow-hidden cursor-pointer">
                      {card.image_url_sm ? (
                        <Image
                          src={card.image_url_sm}
                          alt={card.name}
                          fill
                          className="object-contain transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full bg-muted" />
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-2.5 space-y-1.5">
                    <Link href={`/carta/${card.id}`}>
                      <p className="text-xs font-semibold truncate hover:text-yellow-400 transition-colors">
                        {card.name}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 ${CONDITION_COLOR[item.condition] ?? ''}`}
                      >
                        {item.condition}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">×{item.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-yellow-400">
                        {effectivePrice ? `$${effectivePrice.toFixed(2)}` : '—'}
                      </span>
                      {itemWhatsappUrl && (
                        <a href={itemWhatsappUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" className="h-6 w-6 bg-green-600 hover:bg-green-500 text-white">
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

function buildWhatsappForItem({
  whatsapp,
  displayName,
  cardName,
  condition,
  priceUsd,
}: {
  whatsapp: string
  displayName: string
  cardName: string
  condition: string
  priceUsd: number | null
}) {
  const phone = whatsapp.replace(/\D/g, '')
  const price = priceUsd ? `$${priceUsd.toFixed(2)} USD` : 'precio por confirmar'
  const msg = `¡Hola ${displayName}! Vi tu perfil en Deckcenter.\n\nMe interesa: 1x ${cardName} (${condition}) - ${price}\n\n¿Está disponible? ¡Gracias!`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}
