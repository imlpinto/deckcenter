'use client'

import { useState } from 'react'
import { MessageCircle, ShoppingCart, MapPin, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart-context'
import { buildDirectWhatsappUrl } from '@/lib/cart-context'
import type { CardCondition } from '@/types'

interface SellerOffer {
  inventoryId: string
  quantity: number
  condition: CardCondition
  manualPrice: number | null
  useMarketPrice: boolean
  marketPriceUsd: number | null
  effectivePrice: number | null
  notes: string | null
  sellerId: string
  sellerName: string | null
  storeName: string | null
  storeSlug: string | null
  sellerWhatsapp: string | null
  sellerLocation: string | null
  cardImageSm: string | null
}

interface SellerListProps {
  offers: SellerOffer[]
  cardName: string
}

const CONDITION_LABEL: Record<CardCondition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}

const CONDITION_COLOR: Record<CardCondition, string> = {
  NM: 'border-green-400/50 text-green-400',
  LP: 'border-lime-400/50 text-lime-400',
  MP: 'border-yellow-400/50 text-yellow-400',
  HP: 'border-orange-400/50 text-orange-400',
  DMG: 'border-red-400/50 text-red-400',
}

export function SellerList({ offers, cardName }: SellerListProps) {
  const { addItem, items } = useCart()
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  function handleAddToCart(offer: SellerOffer) {
    addItem({
      inventoryId: offer.inventoryId,
      cardName,
      cardImage: offer.cardImageSm,
      condition: offer.condition,
      quantity: 1,
      availableQuantity: offer.quantity,
      priceUsd: offer.effectivePrice,
      sellerId: offer.sellerId,
      sellerName: offer.sellerName,
      sellerWhatsapp: offer.sellerWhatsapp,
      storeName: offer.storeName,
    })
    setAddedIds(prev => new Set([...prev, offer.inventoryId]))
    setTimeout(() => {
      setAddedIds(prev => { const next = new Set(prev); next.delete(offer.inventoryId); return next })
    }, 2000)
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
        <p className="font-medium text-muted-foreground">No hay vendedores para esta carta</p>
        <p className="text-sm text-muted-foreground mt-1">
          ¿La tienes? <a href="/auth/registro" className="text-yellow-400 hover:underline">Publícala tú</a>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {offers.map((offer, index) => {
        const isInCart = items.some(i => i.inventoryId === offer.inventoryId)
        const justAdded = addedIds.has(offer.inventoryId)
        const priceDiff = offer.effectivePrice && offer.marketPriceUsd
          ? ((offer.effectivePrice - offer.marketPriceUsd) / offer.marketPriceUsd) * 100
          : null

        const whatsappUrl = offer.sellerWhatsapp
          ? buildDirectWhatsappUrl({
              whatsapp: offer.sellerWhatsapp,
              sellerName: offer.sellerName ?? 'Vendedor',
              storeName: offer.storeName,
              cardName,
              condition: offer.condition,
              quantity: 1,
              priceUsd: offer.effectivePrice,
            })
          : null

        return (
          <div
            key={offer.inventoryId}
            className={`relative rounded-xl border bg-card/60 p-4 transition-all ${
              index === 0 ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-border/40'
            }`}
          >
            {/* Badge "Mejor precio" */}
            {index === 0 && offers.length > 1 && (
              <div className="absolute -top-2.5 left-4">
                <Badge className="bg-yellow-400 text-slate-900 text-[10px] px-2">
                  Mejor precio
                </Badge>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">

              {/* Info del vendedor */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">
                    {offer.storeName ?? offer.sellerName ?? 'Vendedor'}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${CONDITION_COLOR[offer.condition]}`}
                  >
                    {offer.condition} — {CONDITION_LABEL[offer.condition]}
                  </Badge>
                  {offer.quantity <= 3 && (
                    <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/40">
                      Últimas {offer.quantity} unidades
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {/* Precio */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-yellow-400">
                      {offer.effectivePrice ? `$${offer.effectivePrice.toFixed(2)}` : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">USD</span>
                    {offer.useMarketPrice && (
                      <Badge variant="secondary" className="text-[10px]">precio mercado</Badge>
                    )}
                  </div>

                  {/* Comparación vs mercado */}
                  {priceDiff !== null && (
                    <span className={`text-xs font-medium ${
                      priceDiff <= 0 ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {priceDiff <= 0
                        ? `${Math.abs(priceDiff).toFixed(0)}% bajo mercado`
                        : `${priceDiff.toFixed(0)}% sobre mercado`}
                    </span>
                  )}
                </div>

                {/* Ubicación y stock */}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {offer.sellerLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {offer.sellerLocation}
                    </span>
                  )}
                  <span>{offer.quantity} disponible{offer.quantity !== 1 ? 's' : ''}</span>
                  {offer.notes && (
                    <span className="italic truncate max-w-[200px]">&ldquo;{offer.notes}&rdquo;</span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 flex-shrink-0">
                {/* Agregar al carrito */}
                <Button
                  size="sm"
                  variant={isInCart ? 'secondary' : 'outline'}
                  onClick={() => handleAddToCart(offer)}
                  className="gap-1.5"
                >
                  {justAdded ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Agregado</>
                  ) : isInCart ? (
                    <><ShoppingCart className="h-3.5 w-3.5" /> En carrito</>
                  ) : (
                    <><ShoppingCart className="h-3.5 w-3.5" /> Agregar</>
                  )}
                </Button>

                {/* WhatsApp directo */}
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Contactar</span>
                    </Button>
                  </a>
                ) : (
                  <Button size="sm" disabled variant="outline" className="text-muted-foreground">
                    Sin WhatsApp
                  </Button>
                )}
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}
