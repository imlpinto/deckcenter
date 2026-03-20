// ============================================================
// TCGMarket - Tipos globales
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

// --- TCGdex API (api.tcgdex.net) — Gratuita, sin API key ---

/** Respuesta resumida al listar/buscar cartas */
export interface TcgdexCardBrief {
  id: string         // ej: "swsh3-136"
  localId: string    // número en el set, ej: "136"
  name: string
  image?: string     // URL base — agregar "/high.webp" o "/low.webp"
}

/** Respuesta completa al obtener una carta por ID */
export interface TcgdexCard {
  id: string
  localId: string
  name: string
  image?: string
  category: 'Pokemon' | 'Trainer' | 'Energy'
  illustrator?: string
  rarity?: string
  hp?: number
  types?: string[]
  evolveFrom?: string
  description?: string
  stage?: string
  set: {
    id: string
    name: string
    serie?: { id: string; name: string }
    cardCount: { total: number; official: number }
    logo?: string
    symbol?: string
    releaseDate?: string
  }
  variants?: {
    normal: boolean
    reverse: boolean
    holo: boolean
    firstEdition: boolean
  }
  tcgplayer?: {
    url?: string
    updatedAt?: string
    prices?: {
      normal?: TcgdexPrice
      holofoil?: TcgdexPrice
      reverseHolofoil?: TcgdexPrice
      '1stEditionNormal'?: TcgdexPrice
      '1stEditionHolofoil'?: TcgdexPrice
    }
  }
  cardmarket?: {
    url?: string
    updatedAt?: string
    prices?: {
      averageSellPrice?: number
      lowPrice?: number
      trendPrice?: number
      avg1?: number
      avg7?: number
      avg30?: number
    }
  }
}

export interface TcgdexPrice {
  low?: number
  mid?: number
  high?: number
  market?: number
  directLow?: number
}

// Alias para no romper el código existente
export type PokemonTcgApiCard = TcgdexCard
export interface PokemonTcgApiResponse {
  data: TcgdexCardBrief[]
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
