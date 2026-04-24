// ============================================================
// Deckcenter - Tipos globales
// ============================================================

export type UserType = 'buyer' | 'seller' | 'both'
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'

// --- Base de Datos ---

export interface Profile {
  id: string
  full_name: string | null
  whatsapp: string | null
  user_type: UserType
  location: string | null
  avatar_url: string | null
  store_name: string | null
  store_slug: string | null
  created_at: string
  updated_at: string
}

export interface TcgCard {
  id: string
  api_id: string
  name: string
  image_url_sm: string | null
  image_url_lg: string | null
  set_name: string | null
  set_id: string | null
  card_number: string | null
  rarity: string | null
  supertype: string | null
  subtypes: string[] | null
  types: string[] | null
  hp: string | null
  tcgplayer_url: string | null
  market_price_usd: number | null
  last_price_update: string | null
  created_at: string
}

export interface Inventory {
  id: string
  seller_id: string
  card_id: string
  quantity: number
  condition: CardCondition
  manual_price: number | null
  use_market_price: boolean
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TiendaAliada {
  id: string
  name: string
  address: string | null
  city: string | null
  maps_url: string | null
  manager_id: string | null
  phone: string | null
  whatsapp: string | null
  logo_url: string | null
  description: string | null
  is_active: boolean
  created_at: string
}

// --- Vista join (inventory + card + seller) ---
export interface InventoryWithDetails {
  id: string
  quantity: number
  condition: CardCondition
  manual_price: number | null
  use_market_price: boolean
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Carta
  api_id: string
  card_name: string
  image_url_sm: string | null
  image_url_lg: string | null
  set_name: string | null
  card_number: string | null
  rarity: string | null
  supertype: string | null
  types: string[] | null
  market_price_usd: number | null
  effective_price_usd: number | null
  // Vendedor
  seller_id: string
  seller_name: string | null
  store_name: string | null
  store_slug: string | null
  seller_whatsapp: string | null
  seller_location: string | null
}

// --- pokemontcg.io API (api.pokemontcg.io/v2) — Gratuita, opcional API key ---

export interface PtcgPriceVariant {
  low?: number
  mid?: number
  high?: number
  market?: number
  directLow?: number
}

export interface PtcgCardSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  ptcgoCode?: string
  releaseDate: string
  images?: { symbol?: string; logo?: string }
}

/** Campos mínimos devueltos en búsquedas (pokemontcg.io devuelve objetos completos) */
export interface PtcgCardBrief {
  id: string           // ej: "sv8pt5-161"
  name: string
  number: string       // número en el set, ej: "161"
  supertype: string    // "Pokémon" | "Trainer" | "Energy"
  subtypes?: string[]
  rarity?: string
  images: { small: string; large: string }
  set: PtcgCardSet
}

/** Carta completa con todos los datos */
export interface PtcgCard extends PtcgCardBrief {
  hp?: string
  types?: string[]
  evolvesFrom?: string
  abilities?: { name: string; text: string; type: string }[]
  attacks?: { name: string; cost: string[]; convertedEnergyCost: number; damage: string; text: string }[]
  weaknesses?: { type: string; value: string }[]
  resistances?: { type: string; value: string }[]
  artist?: string
  flavorText?: string
  regulationMark?: string
  legalities?: { unlimited?: string; standard?: string; expanded?: string }
  tcgplayer?: {
    url?: string
    updatedAt?: string
    prices?: {
      normal?: PtcgPriceVariant
      holofoil?: PtcgPriceVariant
      reverseHolofoil?: PtcgPriceVariant
      '1stEditionHolofoil'?: PtcgPriceVariant
      '1stEditionNormal'?: PtcgPriceVariant
    }
  }
  cardmarket?: {
    url?: string
    updatedAt?: string   // "2025/01/15"
    prices?: {
      averageSellPrice?: number
      lowPrice?: number
      trendPrice?: number
      avg1?: number
      avg7?: number
      avg30?: number
      reverseHoloTrend?: number
      reverseHoloAvg1?: number
      reverseHoloAvg7?: number
      reverseHoloAvg30?: number
      reverseHoloLow?: number
      reverseHoloSell?: number
    }
  }
}

// Alias de compatibilidad
export type TcgdexCard = PtcgCard
export type TcgdexCardBrief = PtcgCardBrief
export type PokemonTcgApiCard = PtcgCard
export interface PokemonTcgApiResponse {
  data: PtcgCardBrief[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

// --- Carrito (cliente, no persiste en DB para el MVP) ---

export interface CartItem {
  inventoryId: string
  cardName: string
  cardImage: string | null
  condition: CardCondition
  quantity: number           // Cantidad que el comprador quiere
  availableQuantity: number  // Máximo disponible
  priceUsd: number | null
  sellerId: string
  sellerName: string | null
  sellerWhatsapp: string | null
  storeName: string | null
}

// --- Condiciones (label legible) ---

export const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}

export const CONDITION_COLORS: Record<CardCondition, string> = {
  NM: 'text-green-400',
  LP: 'text-lime-400',
  MP: 'text-yellow-400',
  HP: 'text-orange-400',
  DMG: 'text-red-400',
}
