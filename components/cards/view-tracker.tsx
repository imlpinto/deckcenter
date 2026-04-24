'use client'

import { useEffect } from 'react'
import { incrementCardView } from '@/lib/actions/views'

/**
 * Componente invisible que registra una vista real del usuario al montar.
 * Se coloca en la página de detalle de carta.
 */
export function ViewTracker({ apiId }: { apiId: string }) {
  useEffect(() => {
    incrementCardView(apiId)
  }, [apiId])
  return null
}
