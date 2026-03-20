import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Zap, Shield, Swords } from 'lucide-react'
import { getCardById, getCardImageLg, getCardImageSm, extractMarketPrice } from '@/lib/pokemon-tcg'
import { createClient } from '@/lib/supabase/server'
import { SellerList } from '@/components/cards/seller-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CardCondition } from '@/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const card = await getCardById(id)
  return {
    title: card ? `${card.name} — ${card.set?.name}` : 'Carta no encontrada',
    description: card
      ? `Compra ${card.name} en TCGMarket. Compara precios de múltiples vendedores.`
      : undefined,
  }
}

export default async function CartaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 1. Datos de la carta desde TCGdex
  const card = await getCardById(id)
  if (!card) notFound()

  const imgLg = getCardImageLg(card.image)
  const imgSm = getCardImageSm(card.image)
  const marketPrice = extractMarketPrice(card)

  // 2. Vendedores desde nuestra DB
  const supabase = await createClient()

  // Buscar la carta en caché local (puede no existir si nadie la ha publicado)
  const { data: cachedCard } = await supabase
    .from('tcg_cards')
    .select('id')
    .eq('api_id', id)
    .single()

  interface InventoryRow {
    id: string
    quantity: number
    condition: string
    manual_price: number | null
    use_market_price: boolean
    notes: string | null
    seller: {
      id: string
      full_name: string | null
      store_name: string | null
      store_slug: string | null
      whatsapp: string | null
      location: string | null
    } | null
  }

  let rawOffers: InventoryRow[] = []

  if (cachedCard) {
    const { data } = await supabase
      .from('inventory')
      .select(`
        id, quantity, condition, manual_price, use_market_price, notes,
        seller:profiles!inner ( id, full_name, store_name, store_slug, whatsapp, location )
      `)
      .eq('card_id', cachedCard.id)
      .eq('is_active', true)
      .gt('quantity', 0)
      .order('manual_price', { ascending: true, nullsFirst: false })

    rawOffers = (data ?? []) as unknown as InventoryRow[]
  }

  // Calcular precio efectivo y ordenar de menor a mayor
  const offers = rawOffers
    .map(row => {
      const seller = row.seller
      const effectivePrice = row.use_market_price ? marketPrice : row.manual_price
      return {
        inventoryId: row.id,
        quantity: row.quantity,
        condition: row.condition as CardCondition,
        manualPrice: row.manual_price,
        useMarketPrice: row.use_market_price,
        marketPriceUsd: marketPrice,
        effectivePrice,
        notes: row.notes,
        sellerId: seller?.id ?? '',
        sellerName: seller?.full_name ?? null,
        storeName: seller?.store_name ?? null,
        storeSlug: seller?.store_slug ?? null,
        sellerWhatsapp: seller?.whatsapp ?? null,
        sellerLocation: seller?.location ?? null,
        cardImageSm: imgSm,
      }
    })
    .sort((a, b) => {
      if (a.effectivePrice === null) return 1
      if (b.effectivePrice === null) return -1
      return a.effectivePrice - b.effectivePrice
    })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">

      {/* Breadcrumb */}
      <Link
        href="/buscar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a resultados
      </Link>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

        {/* ===== Columna izquierda: Imagen + datos ===== */}
        <div className="space-y-5">

          {/* Imagen de la carta */}
          <div className="relative mx-auto w-64 lg:w-full max-w-xs">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {imgLg ? (
                <Image
                  src={imgLg}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 256px, 320px"
                  priority
                  unoptimized
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Sin imagen</span>
                </div>
              )}
            </div>
            {/* Precio de referencia flotante */}
            {marketPrice && (
              <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur rounded-lg px-3 py-1.5 shadow">
                <p className="text-[10px] text-muted-foreground">Ref. TCGPlayer</p>
                <p className="text-sm font-bold text-yellow-400">${marketPrice.toFixed(2)} USD</p>
              </div>
            )}
          </div>

          {/* Ficha técnica */}
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Datos de la carta
            </h2>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Nombre', value: card.name },
                { label: 'Set', value: card.set?.name },
                { label: 'Número', value: card.localId ? `${card.localId}/${card.set?.cardCount?.official}` : null },
                { label: 'Rareza', value: card.rarity },
                { label: 'Categoría', value: card.category },
                { label: 'HP', value: card.hp ? `${card.hp} HP` : null },
                { label: 'Ilustrador', value: card.illustrator },
              ].filter(d => d.value).map(d => (
                <div key={d.label} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground flex-shrink-0">{d.label}</dt>
                  <dd className="font-medium text-right truncate">{d.value}</dd>
                </div>
              ))}
            </dl>

            {/* Tipos */}
            {card.types && card.types.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {card.types.map(t => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {TYPE_EMOJI[t] ?? ''} {t}
                  </Badge>
                ))}
              </div>
            )}

            {/* Ataques */}
            {card.category === 'Pokemon' && (
              <div className="pt-1 space-y-1">
                {card.illustrator && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Swords className="h-3 w-3" />
                    Ataques disponibles en TCGdex
                  </div>
                )}
              </div>
            )}

            {/* Link a TCGPlayer */}
            {card.tcgplayer?.url && (
              <a
                href={card.tcgplayer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Ver en TCGPlayer
                </Button>
              </a>
            )}
          </div>

        </div>

        {/* ===== Columna derecha: Vendedores ===== */}
        <div className="space-y-5">

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{card.name}</h1>
            <p className="text-muted-foreground mt-1">
              {card.set?.name}
              {card.rarity && <> · <span className="text-yellow-400">{card.rarity}</span></>}
            </p>
          </div>

          {/* Precio de referencia destacado */}
          {marketPrice && (
            <div className="flex items-center gap-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Precio de referencia (TCGPlayer)</p>
                <p className="text-2xl font-bold text-yellow-400">${marketPrice.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">USD</span></p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Mercado internacional
              </div>
            </div>
          )}

          {/* Sección de vendedores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                {offers.length > 0
                  ? `${offers.length} vendedor${offers.length !== 1 ? 'es' : ''} disponible${offers.length !== 1 ? 's' : ''}`
                  : 'Vendedores'}
              </h2>
              {offers.length > 0 && (
                <p className="text-xs text-muted-foreground">Ordenados por precio</p>
              )}
            </div>

            <SellerList
              offers={offers}
              cardName={card.name}
            />
          </div>

        </div>

      </div>
    </div>
  )
}

const TYPE_EMOJI: Record<string, string> = {
  Fire: '🔥', Water: '💧', Grass: '🌿', Electric: '⚡',
  Psychic: '🔮', Fighting: '👊', Darkness: '🌑', Metal: '⚙️',
  Dragon: '🐉', Fairy: '✨', Colorless: '⭐',
}
