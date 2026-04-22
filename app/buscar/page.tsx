import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '@/components/search/search-bar'
import { searchCards, getCardImageSm } from '@/lib/pokemon-tcg'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'

const PAGE_SIZE = 24

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Buscar Cartas` : 'Buscar Cartas',
  }
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  // Resultados de TCGdex
  let cards: Awaited<ReturnType<typeof searchCards>>['data'] = []
  let error = false

  if (query) {
    try {
      const result = await searchCards(query, page, PAGE_SIZE)
      cards = result.data
    } catch {
      error = true
    }
  }

  // Detectar qué cartas del resultado tienen vendedores en nuestra plataforma
  const apiIds = cards.map(c => c.id)
  const apiIdsWithSellers = new Set<string>()

  if (apiIds.length > 0) {
    const supabase = await createClient()
    const { data: withSellers } = await supabase
      .from('inventory')
      .select('card:tcg_cards!inner(api_id)')
      .eq('is_active', true)
      .gt('quantity', 0)

    if (withSellers) {
      for (const row of withSellers) {
        const card = row.card as unknown as { api_id: string } | null
        if (card) apiIdsWithSellers.add(card.api_id)
      }
    }
  }

  const hasNext = cards.length === PAGE_SIZE
  const hasPrev = page > 1

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Buscador */}
      <div className="max-w-2xl">
        <SearchBar size="default" />
      </div>

      {/* Header de resultados */}
      {query && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {cards.length > 0
                ? `Resultados para "${query}"`
                : `Sin resultados para "${query}"`}
            </h1>
            {cards.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Página {page} · {cards.length} cartas
              </p>
            )}
          </div>
        </div>
      )}

      {/* Estado vacío / error */}
      {query && cards.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">No encontramos cartas para &quot;{query}&quot;</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Intenta con otro nombre, revisa la ortografía o busca en inglés.
          </p>
        </div>
      )}

      {!query && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">Escribe el nombre de una carta para buscar</p>
        </div>
      )}

      {/* Grid de cartas */}
      {cards.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {cards.map((card) => {
              const imgSrc = getCardImageSm(card.image)
              const hasSellers = apiIdsWithSellers.has(card.id)

              return (
                <Link key={card.id} href={`/carta/${card.id}`}>
                  <div className="group relative rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:border-yellow-400/40 hover:shadow-md hover:shadow-yellow-400/5 hover:-translate-y-0.5 cursor-pointer">

                    {/* Badge "Disponible" */}
                    {hasSellers && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 shadow">
                          En venta
                        </Badge>
                      </div>
                    )}

                    {/* Imagen */}
                    <div className="relative aspect-[5/7] bg-muted overflow-hidden">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={card.name}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate leading-tight">{card.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        #{card.localId}
                      </p>
                    </div>

                  </div>
                </Link>
              )
            })}
          </div>

          {/* Paginación */}
          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-center gap-3 pt-4">
              {hasPrev && (
                <Link href={`/buscar?q=${encodeURIComponent(query)}&page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">Página {page}</span>
              {hasNext && (
                <Link href={`/buscar?q=${encodeURIComponent(query)}&page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}

    </div>
  )
}
