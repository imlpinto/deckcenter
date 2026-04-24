import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { SearchBar } from '@/components/search/search-bar'
import { SearchFilters } from '@/components/search/search-filters'
import type { FilterOptions, ActiveFilters } from '@/components/search/search-filters'
import { searchCards } from '@/lib/pokemon-tcg'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, SearchX, Package } from 'lucide-react'

const PAGE_SIZE = 24

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Buscar Cartas` : 'Buscar Cartas — Deckcenter',
  }
}

// ─── Tipos internos ────────────────────────────────────────────────────────

type InventoryCard = {
  api_id: string
  name: string
  image_url_sm: string | null
  set_name: string | null
  rarity: string | null
  supertype: string | null
  market_price_usd: number | null
  minPrice: number | null
  sellerCount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function sortInventoryCards(cards: InventoryCard[], sort: string): InventoryCard[] {
  return [...cards].sort((a, b) => {
    if (sort === 'price_asc') {
      if (a.minPrice == null) return 1
      if (b.minPrice == null) return -1
      return a.minPrice - b.minPrice
    }
    if (sort === 'price_desc') {
      if (a.minPrice == null) return 1
      if (b.minPrice == null) return -1
      return b.minPrice - a.minPrice
    }
    if (sort === 'name_asc') {
      return a.name.localeCompare(b.name)
    }
    // default: más vendedores primero
    return b.sellerCount - a.sellerCount
  })
}

// ─── Componente principal ─────────────────────────────────────────────────

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; set?: string; rarity?: string; supertype?: string; sort?: string }>
}) {
  const params = await searchParams
  const query   = params.q?.trim() ?? ''
  const page    = Math.max(1, parseInt(params.page ?? '1', 10))
  const selSet       = params.set ?? ''
  const selRarity    = params.rarity ?? ''
  const selSupertype = params.supertype ?? ''
  const selSort      = params.sort ?? ''

  const supabase = await createClient()

  // ── Opciones de filtros (sets y rarezas disponibles en inventario) ──────
  const [setsRes, raritiesRes] = await Promise.all([
    supabase
      .from('tcg_cards')
      .select('set_name')
      .not('set_name', 'is', null)
      .order('set_name'),
    supabase
      .from('tcg_cards')
      .select('rarity')
      .not('rarity', 'is', null)
      .order('rarity'),
  ])

  const filterOptions: FilterOptions = {
    sets: [...new Set((setsRes.data ?? []).map(r => r.set_name as string))].sort(),
    rarities: [...new Set((raritiesRes.data ?? []).map(r => r.rarity as string))].sort(),
  }

  const activeFilters: ActiveFilters = {
    set: selSet,
    rarity: selRarity,
    supertype: selSupertype,
    sort: selSort,
  }

  // ── Vista sin búsqueda: cartas en stock en la plataforma ───────────────
  let inventoryCards: InventoryCard[] = []

  if (!query) {
    let dbQuery = supabase
      .from('tcg_cards')
      .select(`
        api_id, name, image_url_sm, set_name, rarity, supertype, market_price_usd,
        inventory!inner(manual_price, use_market_price, seller_id, quantity, is_active)
      `)
      .eq('inventory.is_active', true)
      .gt('inventory.quantity', 0)

    if (selSet)       dbQuery = dbQuery.eq('set_name', selSet)
    if (selRarity)    dbQuery = dbQuery.eq('rarity', selRarity)
    if (selSupertype) dbQuery = dbQuery.eq('supertype', selSupertype)

    const { data: rawRows } = await dbQuery

    // Agrupar por carta — calcular precio mínimo y conteo de vendedores
    type RawRow = {
      api_id: string; name: string; image_url_sm: string | null
      set_name: string | null; rarity: string | null; supertype: string | null
      market_price_usd: number | null
      inventory: { manual_price: number | null; use_market_price: boolean; seller_id: string; quantity: number; is_active: boolean }[]
    }

    const cardMap = new Map<string, InventoryCard>()
    for (const row of (rawRows ?? []) as unknown as RawRow[]) {
      const invItems = Array.isArray(row.inventory) ? row.inventory : [row.inventory]
      for (const inv of invItems) {
        const effectivePrice = inv.use_market_price ? row.market_price_usd : inv.manual_price
        if (!cardMap.has(row.api_id)) {
          cardMap.set(row.api_id, {
            api_id: row.api_id, name: row.name,
            image_url_sm: row.image_url_sm, set_name: row.set_name,
            rarity: row.rarity, supertype: row.supertype,
            market_price_usd: row.market_price_usd,
            minPrice: effectivePrice, sellerCount: 1,
          })
        } else {
          const existing = cardMap.get(row.api_id)!
          if (effectivePrice != null && (existing.minPrice == null || effectivePrice < existing.minPrice)) {
            existing.minPrice = effectivePrice
          }
          existing.sellerCount++
        }
      }
    }

    inventoryCards = sortInventoryCards(Array.from(cardMap.values()), selSort)
  }

  // Paginar inventario
  const invTotal = inventoryCards.length
  const invPageCards = inventoryCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const invHasPrev = page > 1
  const invHasNext = page * PAGE_SIZE < invTotal

  // ── Vista con búsqueda: pokemontcg.io ──────────────────────────────────
  let searchResults: Awaited<ReturnType<typeof searchCards>>['data'] = []
  let searchError = false
  let searchTotalCount = 0

  if (query) {
    try {
      // Combinar query con filtros de la API
      let apiQuery = `name:${query}*`
      if (selSupertype) apiQuery += ` supertype:${selSupertype}`
      if (selSet)       apiQuery += ` set.name:"${selSet}"`
      if (selRarity)    apiQuery += ` rarity:"${selRarity}"`

      const result = await searchCards(apiQuery.trim(), page, PAGE_SIZE)
      searchResults = result.data
      searchTotalCount = result.totalCount
    } catch {
      searchError = true
    }
  }

  // Detectar cuáles tienen vendedores en plataforma
  const apiIds = searchResults.map(c => c.id)
  const apiIdsWithSellers = new Set<string>()
  if (apiIds.length > 0) {
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

  const searchHasPrev = page > 1
  const searchHasNext = page * PAGE_SIZE < searchTotalCount

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Mobile: buscador full-width + botón de filtros */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex-1 min-w-0">
          <SearchBar size="default" />
        </div>
        <Suspense>
          <SearchFilters options={filterOptions} active={activeFilters} />
        </Suspense>
      </div>

      {/* Desktop: fila centrada buscador + filtros inline */}
      <div className="hidden lg:flex items-center justify-center gap-3">
        <div className="min-w-[280px] max-w-sm flex-shrink-0">
          <SearchBar size="default" />
        </div>
        <Suspense>
          <SearchFilters options={filterOptions} active={activeFilters} />
        </Suspense>
      </div>

      {/* ── VISTA SIN BÚSQUEDA: inventario de la plataforma ─────────── */}
      {!query && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Cartas disponibles</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {invTotal > 0
                  ? `${invTotal} carta${invTotal !== 1 ? 's' : ''} en stock · página ${page}`
                  : 'Sin cartas con los filtros seleccionados'}
              </p>
            </div>
          </div>

          {/* Empty state */}
          {invTotal === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">
                {selSet || selRarity || selSupertype
                  ? 'Sin resultados con esos filtros'
                  : 'Aún no hay cartas publicadas'}
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                {selSet || selRarity || selSupertype
                  ? 'Prueba ajustando o limpiando los filtros'
                  : 'Sé el primero en publicar una carta en Deckcenter'}
              </p>
            </div>
          )}

          {/* Grid */}
          {invPageCards.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                {invPageCards.map(card => (
                  <Link key={card.api_id} href={`/carta/${card.api_id}`}>
                    <div className="group relative rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:border-yellow-400/40 hover:shadow-md hover:shadow-yellow-400/5 hover:-translate-y-0.5 cursor-pointer h-full flex flex-col">

                      {/* Badge vendedores */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 shadow">
                          {card.sellerCount} {card.sellerCount === 1 ? 'vendedor' : 'vendedores'}
                        </Badge>
                      </div>

                      {/* Imagen */}
                      <div className="relative aspect-[5/7] bg-muted overflow-hidden flex-shrink-0">
                        {card.image_url_sm ? (
                          <Image
                            src={card.image_url_sm}
                            alt={card.name}
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">Sin img</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2 flex flex-col gap-0.5 flex-1">
                        <p className="text-[11px] font-semibold truncate leading-tight">{card.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{card.set_name}</p>
                        {card.minPrice != null && (
                          <p className="text-[11px] font-medium text-yellow-400 mt-0.5">
                            ${card.minPrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Paginación */}
              {(invHasPrev || invHasNext) && (
                <Pagination page={page} hasPrev={invHasPrev} hasNext={invHasNext} query={query} params={params} />
              )}
            </>
          )}
        </>
      )}

      {/* ── VISTA CON BÚSQUEDA: resultados de la API ─────────────────── */}
      {query && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {searchResults.length > 0 || !searchError
                  ? `Resultados para "${query}"`
                  : `Sin resultados para "${query}"`}
              </h1>
              {searchResults.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {searchTotalCount > 0 ? `${searchTotalCount} cartas encontradas · ` : ''}página {page}
                </p>
              )}
            </div>
          </div>

          {/* Empty / Error */}
          {searchResults.length === 0 && !searchError && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No encontramos cartas para &quot;{query}&quot;</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Intenta con otro nombre, revisa la ortografía o ajusta los filtros.
              </p>
            </div>
          )}

          {/* Grid */}
          {searchResults.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                {searchResults.map(card => {
                  const hasSellers = apiIdsWithSellers.has(card.id)
                  return (
                    <Link key={card.id} href={`/carta/${card.id}`}>
                      <div className="group relative rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:border-yellow-400/40 hover:shadow-md hover:shadow-yellow-400/5 hover:-translate-y-0.5 cursor-pointer">
                        {hasSellers && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 shadow">
                              En venta
                            </Badge>
                          </div>
                        )}
                        <div className="relative aspect-[5/7] bg-muted overflow-hidden">
                          {card.images?.small ? (
                            <Image
                              src={card.images.small}
                              alt={card.name}
                              fill
                              className="object-contain transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">Sin img</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-semibold truncate leading-tight">{card.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {card.set?.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {(searchHasPrev || searchHasNext) && (
                <Pagination page={page} hasPrev={searchHasPrev} hasNext={searchHasNext} query={query} params={params} />
              )}
            </>
          )}
        </>
      )}

    </div>
  )
}

// ─── Paginación ────────────────────────────────────────────────────────────

function Pagination({
  page, hasPrev, hasNext, query, params,
}: {
  page: number
  hasPrev: boolean
  hasNext: boolean
  query: string
  params: Record<string, string | undefined>
}) {
  function buildUrl(p: number) {
    const qs = new URLSearchParams()
    if (query) qs.set('q', query)
    if (params.set)       qs.set('set', params.set)
    if (params.rarity)    qs.set('rarity', params.rarity)
    if (params.supertype) qs.set('supertype', params.supertype)
    if (params.sort)      qs.set('sort', params.sort)
    qs.set('page', String(p))
    return `/buscar?${qs.toString()}`
  }

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      {hasPrev && (
        <Link href={buildUrl(page - 1)}>
          <Button variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
        </Link>
      )}
      <span className="text-sm text-muted-foreground">Página {page}</span>
      {hasNext && (
        <Link href={buildUrl(page + 1)}>
          <Button variant="outline" size="sm" className="gap-1">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}
