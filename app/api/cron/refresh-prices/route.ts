import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractMarketPrice } from '@/lib/pokemon-tcg'
import type { TcgdexCard } from '@/types'

const BASE_URL = 'https://api.tcgdex.net/v2/en'

export async function GET(req: NextRequest) {
  // Verificar secret para evitar llamadas no autorizadas
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Traer todas las cartas que están en inventario activo
  const { data: cards, error } = await supabase
    .from('tcg_cards')
    .select('id, api_id, market_price_usd')
    .in(
      'id',
      supabase
        .from('inventory')
        .select('card_id')
        .eq('is_active', true) as unknown as string[]
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!cards || cards.length === 0) {
    return NextResponse.json({ updated: 0, message: 'No hay cartas en inventario activo' })
  }

  let updated = 0
  let failed = 0
  const results: { api_id: string; old: number | null; new: number | null }[] = []

  for (const card of cards) {
    try {
      const res = await fetch(`${BASE_URL}/cards/${card.api_id}`, {
        cache: 'no-store',
      })
      if (!res.ok) { failed++; continue }

      const apiCard: TcgdexCard = await res.json()
      const newPrice = extractMarketPrice(apiCard)

      // Registrar snapshot diario en historial (independiente de si cambió el precio)
      if (newPrice !== null) {
        await supabase
          .from('price_history')
          .insert({ card_id: card.id, price_usd: newPrice, source: 'tcgplayer' })
      }

      // Solo actualizar tcg_cards si el precio cambió
      if (newPrice !== card.market_price_usd) {
        await supabase
          .from('tcg_cards')
          .update({
            market_price_usd: newPrice,
            last_price_update: new Date().toISOString(),
          })
          .eq('id', card.id)

        results.push({ api_id: card.api_id, old: card.market_price_usd, new: newPrice })
        updated++
      }

      // Pausa pequeña para no saturar la API
      await new Promise(r => setTimeout(r, 150))
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    ok: true,
    total: cards.length,
    updated,
    failed,
    changes: results,
    timestamp: new Date().toISOString(),
  })
}
