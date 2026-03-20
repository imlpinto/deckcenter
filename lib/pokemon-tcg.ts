// ============================================================
// Cliente para la TCGdex API (api.tcgdex.net)
// Documentación: https://tcgdex.dev
// ✅ Gratuita · Sin API key · Sin registro
// ============================================================

import type { TcgdexCard, TcgdexCardBrief, PokemonTcgApiResponse } from '@/types'

const BASE_URL = 'https://api.tcgdex.net/v2/en'

// Helpers de imagen — TCGdex devuelve una URL base, se le agrega el formato
export function getCardImageSm(imageBase?: string): string | null {
  if (!imageBase) return null
  return `${imageBase}/low.webp`
}

export function getCardImageLg(imageBase?: string): string | null {
  if (!imageBase) return null
  return `${imageBase}/high.webp`
}

// Buscar cartas por nombre (autocompletado y resultados)
// TCGdex usa `name=pikachu` para "contiene" (case-insensitive)
// y `name=pika*` para "empieza con"
export async function searchCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<PokemonTcgApiResponse> {
  const params = new URLSearchParams({
    name: query.trim(),                   // partial match por defecto
    'sort:field': 'name',
    'sort:order': 'ASC',
    'pagination:page': String(page),
    'pagination:itemsPerPage': String(pageSize),
  })

  const url = `${BASE_URL}/cards?${params}`

  const res = await fetch(url, {
    next: { revalidate: 3600 }, // cache 1 hora en Next.js
  })

  if (!res.ok) {
    throw new Error(`TCGdex API error: ${res.status}`)
  }

  const data: TcgdexCardBrief[] = await res.json()

  // Normalizar al formato que usa el resto del código
  return {
    data,
    page,
    pageSize,
    count: data.length,
    totalCount: data.length, // TCGdex no expone total en la lista simple
  }
}

// Obtener carta completa por ID (ej: "swsh3-136")
export async function getCardById(apiId: string): Promise<TcgdexCard | null> {
  const url = `${BASE_URL}/cards/${apiId}`

  const res = await fetch(url, {
    next: { revalidate: 86400 }, // cache 24 horas
  })

  if (!res.ok) return null

  return res.json()
}

// Extraer precio de mercado de una carta
// TCGdex incluye precios de TCGPlayer y Cardmarket directamente
export function extractMarketPrice(card: TcgdexCard): number | null {
  // Prioridad: TCGPlayer market > Cardmarket trend
  const tcgPrices = card.tcgplayer?.prices
  if (tcgPrices) {
    return (
      tcgPrices.holofoil?.market ??
      tcgPrices['1stEditionHolofoil']?.market ??
      tcgPrices.normal?.market ??
      tcgPrices['1stEditionNormal']?.market ??
      tcgPrices.reverseHolofoil?.market ??
      null
    )
  }

  // Fallback: Cardmarket trend price
  return card.cardmarket?.prices?.trendPrice ?? null
}

// Convertir carta de TCGdex al formato de nuestra DB (tabla tcg_cards)
export function mapApiCardToDb(card: TcgdexCard) {
  return {
    api_id: card.id,
    name: card.name,
    image_url_sm: getCardImageSm(card.image),
    image_url_lg: getCardImageLg(card.image),
    set_name: card.set.name,
    set_id: card.set.id,
    card_number: `${card.localId}/${card.set.cardCount.official}`,
    rarity: card.rarity ?? null,
    supertype: card.category,
    subtypes: card.stage ? [card.stage] : [],
    types: card.types ?? [],
    hp: card.hp ? String(card.hp) : null,
    tcgplayer_url: card.tcgplayer?.url ?? null,
    market_price_usd: extractMarketPrice(card),
    last_price_update: card.tcgplayer?.updatedAt
      ? new Date(card.tcgplayer.updatedAt).toISOString()
      : null,
  }
}
