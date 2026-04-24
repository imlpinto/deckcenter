// ============================================================
// Cliente para pokemontcg.io API (api.pokemontcg.io/v2)
// Documentación: https://docs.pokemontcg.io
// ✅ Solo TCG físico · Sets recientes · Precios USD de TCGPlayer
// ============================================================

import type { PtcgCard, PtcgCardBrief, PokemonTcgApiResponse } from '@/types'

const BASE_URL = 'https://api.pokemontcg.io/v2'

// Helpers de imagen — pokemontcg.io ya devuelve URLs completas
export function getCardImageSm(url?: string): string | null {
  return url ?? null
}

export function getCardImageLg(url?: string): string | null {
  return url ?? null
}

// Buscar cartas — acepta query completo en formato pokemontcg.io
// Ejemplos: "name:charizard*", "name:pikachu* supertype:Pokémon rarity:Rare"
// Si el query no contiene ":" se asume búsqueda por nombre (name:term*)
export async function searchCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<PokemonTcgApiResponse> {
  const q = query.trim().includes(':') ? query.trim() : `name:${query.trim()}*`
  const params = new URLSearchParams({
    q,
    page: String(page),
    pageSize: String(pageSize),
    orderBy: 'name',
  })

  const res = await fetch(`${BASE_URL}/cards?${params}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`pokemontcg.io error: ${res.status}`)

  const json = await res.json()

  return {
    data: (json.data ?? []) as PtcgCardBrief[],
    page,
    pageSize,
    count: json.count ?? 0,
    totalCount: json.totalCount ?? 0,
  }
}

// Obtener carta completa por ID (ej: "sv8pt5-161")
export async function getCardById(apiId: string): Promise<PtcgCard | null> {
  const res = await fetch(`${BASE_URL}/cards/${apiId}`, {
    next: { revalidate: 86400 },
  })

  if (!res.ok) return null

  const json = await res.json()
  return json.data as PtcgCard
}

// Extraer precio de mercado en USD (TCGPlayer, ya en USD)
// Prioridad: holofoil > reverseHolofoil > normal > 1stEditionHolofoil
export function extractMarketPrice(card: PtcgCard): number | null {
  const prices = card.tcgplayer?.prices
  if (prices) {
    return (
      prices.holofoil?.market ??
      prices.holofoil?.mid ??
      prices.reverseHolofoil?.market ??
      prices.normal?.market ??
      prices.normal?.mid ??
      prices['1stEditionHolofoil']?.market ??
      null
    )
  }
  // Fallback: Cardmarket trendPrice convertido a USD
  const cm = card.cardmarket?.prices
  if (cm) {
    const eurPrice = cm.trendPrice ?? cm.averageSellPrice ?? null
    if (eurPrice) return eurPrice * 1.1  // conversión EUR→USD aproximada
  }
  return null
}

// Tipo de cambio EUR → USD (Frankfurter API, cache 1 hora)
// Se usa solo para mostrar precios de Cardmarket en el gráfico
export async function getEurToUsd(): Promise<number> {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return 1.10
    const data = await res.json()
    return data.rates?.USD ?? 1.10
  } catch {
    return 1.10
  }
}

// Convertir carta de pokemontcg.io al formato de nuestra DB (tabla tcg_cards)
export function mapApiCardToDb(card: PtcgCard) {
  return {
    api_id: card.id,
    name: card.name,
    image_url_sm: card.images.small,
    image_url_lg: card.images.large,
    set_name: card.set.name,
    set_id: card.set.id,
    card_number: `${card.number}/${card.set.total}`,
    rarity: card.rarity ?? null,
    supertype: card.supertype,
    subtypes: card.subtypes ?? [],
    types: card.types ?? [],
    hp: card.hp ?? null,
    tcgplayer_url: card.tcgplayer?.url ?? null,
    market_price_usd: extractMarketPrice(card),
    last_price_update: card.tcgplayer?.updatedAt
      ? new Date(card.tcgplayer.updatedAt).toISOString()
      : null,
  }
}
