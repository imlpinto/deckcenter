'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Package, MessageCircle, Search, X, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type SellerItem = {
  id: string
  full_name: string | null
  store_name: string | null
  store_slug: string | null
  whatsapp: string | null
  location: string | null
  avatar_url: string | null
  cardCount: number
}

const PAGE_SIZE = 18

export function SellerGrid({ sellers }: { sellers: SellerItem[] }) {
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loaderRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim().length === 0
    ? sellers
    : sellers.filter(s => {
        const q = query.toLowerCase()
        return (
          s.store_name?.toLowerCase().includes(q) ||
          s.full_name?.toLowerCase().includes(q) ||
          s.store_slug?.toLowerCase().includes(q)
        )
      })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  // Reset paginación cuando cambia la búsqueda
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query])

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE)
  }, [])

  // Infinite scroll con IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <div className="space-y-6">

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre o tienda..."
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Conteo de resultados cuando se filtra */}
      {query.trim() && (
        <p className="text-sm text-muted-foreground -mt-2">
          {filtered.length === 0
            ? 'Sin resultados para esa búsqueda'
            : `${filtered.length} vendedor${filtered.length !== 1 ? 'es' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Empty search state */}
      {filtered.length === 0 && query.trim() && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No encontramos ese vendedor</p>
          <p className="text-sm text-muted-foreground mt-1">Prueba con otro nombre o tienda</p>
        </div>
      )}

      {/* Grid */}
      {visible.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {visible.map(seller => {
            const displayName = seller.store_name ?? seller.full_name ?? 'Vendedor'
            const whatsappUrl = seller.whatsapp
              ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${displayName}! Vi tu perfil en Deckcenter 🃏`)}`
              : null

            return (
              <div
                key={seller.id}
                className="flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4 hover:border-yellow-400/30 transition-all text-center"
              >
                {/* Avatar */}
                <div className="relative h-14 w-14 flex-shrink-0 rounded-full overflow-hidden bg-yellow-400/15 border border-yellow-400/20">
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
                      <span className="text-xl font-bold text-yellow-400">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="w-full min-w-0 space-y-1">
                  <p className="font-semibold text-sm truncate leading-tight">{displayName}</p>
                  {seller.location && (
                    <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{seller.location}</span>
                    </p>
                  )}
                  <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5">
                    <Package className="h-2.5 w-2.5" />
                    {seller.cardCount} carta{seller.cardCount !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Acciones */}
                <div className="flex flex-col lg:flex-row gap-1.5 w-full mt-auto">
                  {seller.store_slug && (
                    <Link href={`/vendedor/${seller.store_slug}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs h-7">
                        Ver perfil
                      </Button>
                    </Link>
                  )}
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-500 text-white gap-1 text-xs h-7">
                        <MessageCircle className="h-3 w-3" />
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

      {/* Sentinel para infinite scroll */}
      {hasMore && <div ref={loaderRef} className="h-10" />}

    </div>
  )
}
