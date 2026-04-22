import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export interface RecommendedCard {
  api_id: string
  name: string
  image_url_sm: string | null
  market_price_usd: number | null
  total_stock: number
  view_count: number
}

interface RecommendedCardsProps {
  cards: RecommendedCard[]
}

export function RecommendedCards({ cards }: RecommendedCardsProps) {
  if (cards.length === 0) return null

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-yellow-400" />
        <h2 className="font-semibold text-base">Cartas populares en Deckcenter</h2>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {cards.map(card => (
          <Link
            key={card.api_id}
            href={`/carta/${card.api_id}`}
            className="group flex flex-col gap-1.5"
          >
            {/* Imagen */}
            <div className="relative aspect-[5/7] rounded-lg overflow-hidden bg-muted/30 shadow-md group-hover:shadow-yellow-400/20 transition-shadow">
              {card.image_url_sm ? (
                <Image
                  src={card.image_url_sm}
                  alt={card.name}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 30vw, (max-width: 768px) 25vw, 16vw"
                  unoptimized
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                  Sin imagen
                </div>
              )}
              {/* Stock badge */}
              <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur rounded px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {card.total_stock} en stock
              </div>
            </div>

            {/* Info */}
            <div className="space-y-0.5 px-0.5">
              <p className="text-xs font-medium leading-tight line-clamp-2 group-hover:text-yellow-400 transition-colors">
                {card.name}
              </p>
              {card.market_price_usd != null && card.market_price_usd > 0 && (
                <p className="text-[10px] text-yellow-400 font-semibold">
                  ${card.market_price_usd.toFixed(2)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
