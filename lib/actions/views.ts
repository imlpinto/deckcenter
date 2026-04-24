'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Incrementa el contador de vistas de una carta.
 * Llamado desde el cliente (ViewTracker) en cada visita real de usuario.
 */
export async function incrementCardView(apiId: string) {
  if (!apiId) return
  const supabase = await createClient()
  // Usa la función SQL para incremento atómico
  await supabase.rpc('increment_card_view', { p_api_id: apiId })
}
