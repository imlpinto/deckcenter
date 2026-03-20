'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCardById, mapApiCardToDb } from '@/lib/pokemon-tcg'
import type { CardCondition } from '@/types'

// Agregar carta al inventario
// 1. Busca/inserta la carta en tcg_cards (caché)
// 2. Inserta/actualiza en inventory
export async function addToInventory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const apiId = formData.get('api_id') as string
  const condition = formData.get('condition') as CardCondition
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const manualPrice = formData.get('manual_price')
    ? parseFloat(formData.get('manual_price') as string)
    : null
  const useMarketPrice = formData.get('use_market_price') === 'true'
  const notes = (formData.get('notes') as string) || null
  const photo = formData.get('photo') as File | null

  // Subir foto personalizada a Supabase Storage (si se proporcionó)
  let customImageUrl: string | null = null
  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { data: uploaded, error: uploadErr } = await supabase.storage
      .from('card-photos')
      .upload(path, photo, { contentType: photo.type, upsert: false })
    if (uploadErr) return { error: `Error subiendo foto: ${uploadErr.message}` }
    const { data: { publicUrl } } = supabase.storage
      .from('card-photos')
      .getPublicUrl(uploaded.path)
    customImageUrl = publicUrl
  }

  // 1. Asegurar que la carta esté en caché local
  let { data: cachedCard } = await supabase
    .from('tcg_cards')
    .select('id')
    .eq('api_id', apiId)
    .single()

  if (!cachedCard) {
    const apiCard = await getCardById(apiId)
    if (!apiCard) return { error: 'Carta no encontrada en la API' }

    const cardData = mapApiCardToDb(apiCard)
    const { data: inserted, error: insertErr } = await supabase
      .from('tcg_cards')
      .insert(cardData)
      .select('id')
      .single()

    if (insertErr) return { error: insertErr.message }
    cachedCard = inserted
  }

  // 2. Upsert en inventory (misma carta + misma condición = actualizar)
  const { error } = await supabase
    .from('inventory')
    .upsert(
      {
        seller_id: user.id,
        card_id: cachedCard.id,
        condition,
        quantity,
        manual_price: manualPrice,
        use_market_price: useMarketPrice,
        notes,
        custom_image_url: customImageUrl,
        is_active: true,
      },
      { onConflict: 'seller_id,card_id,condition' }
    )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  return { success: true }
}

// Actualizar cantidad o precio de un item existente
export async function updateInventoryItem(
  id: string,
  fields: {
    quantity?: number
    manual_price?: number | null
    use_market_price?: boolean
    condition?: CardCondition
    notes?: string | null
    is_active?: boolean
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('inventory')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('seller_id', user.id) // RLS doble: solo el propio vendedor

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  return { success: true }
}

// Eliminar (marcar inactivo) un item del inventario
export async function removeFromInventory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('inventory')
    .update({ is_active: false })
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  return { success: true }
}

// Obtener el inventario completo del vendedor logueado
export async function getMyInventory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('inventory')
    .select(`
      id, quantity, condition, manual_price, use_market_price, notes, is_active, created_at, updated_at,
      card:tcg_cards (
        id, api_id, name, image_url_sm, set_name, card_number, rarity, market_price_usd
      )
    `)
    .eq('seller_id', user.id)
    .order('updated_at', { ascending: false })

  return data ?? []
}
