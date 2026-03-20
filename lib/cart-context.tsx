'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { CartItem, CardCondition } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (inventoryId: string) => void
  updateQuantity: (inventoryId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  // Agrupa items por vendedor y genera URL de WhatsApp para cada uno
  getSellerGroups: () => SellerGroup[]
}

export interface SellerGroup {
  sellerId: string
  sellerName: string
  storeName: string | null
  whatsapp: string | null
  items: CartItem[]
  subtotal: number
  whatsappUrl: string
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.inventoryId === newItem.inventoryId)
      if (existing) {
        // Incrementar cantidad sin superar el disponible
        const nextQty = Math.min(existing.quantity + (newItem.quantity ?? 1), existing.availableQuantity)
        return prev.map(i => i.inventoryId === newItem.inventoryId ? { ...i, quantity: nextQty } : i)
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }]
    })
  }, [])

  const removeItem = useCallback((inventoryId: string) => {
    setItems(prev => prev.filter(i => i.inventoryId !== inventoryId))
  }, [])

  const updateQuantity = useCallback((inventoryId: string, quantity: number) => {
    setItems(prev =>
      prev.map(i => {
        if (i.inventoryId !== inventoryId) return i
        if (quantity <= 0) return null as unknown as CartItem
        return { ...i, quantity: Math.min(quantity, i.availableQuantity) }
      }).filter(Boolean)
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const getSellerGroups = useCallback((): SellerGroup[] => {
    const map = new Map<string, SellerGroup>()

    for (const item of items) {
      const existing = map.get(item.sellerId)
      const itemSubtotal = (item.priceUsd ?? 0) * item.quantity

      if (existing) {
        existing.items.push(item)
        existing.subtotal += itemSubtotal
      } else {
        map.set(item.sellerId, {
          sellerId: item.sellerId,
          sellerName: item.sellerName ?? 'Vendedor',
          storeName: item.storeName,
          whatsapp: item.sellerWhatsapp,
          items: [item],
          subtotal: itemSubtotal,
          whatsappUrl: '',
        })
      }
    }

    // Generar URL de WhatsApp por grupo
    for (const group of map.values()) {
      group.whatsappUrl = buildWhatsappUrl(group)
    }

    return Array.from(map.values())
  }, [items])

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, getSellerGroups }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}

// Construye la URL de WhatsApp con mensaje prellenado
function buildWhatsappUrl(group: SellerGroup): string {
  if (!group.whatsapp) return ''

  const phone = group.whatsapp.replace(/\D/g, '') // solo dígitos

  const itemLines = group.items
    .map(i => `• ${i.quantity}x ${i.cardName} (${i.condition}) - $${(i.priceUsd ?? 0).toFixed(2)} USD`)
    .join('\n')

  const message = [
    `¡Hola ${group.storeName ?? group.sellerName}! Vi tus cartas en TCGMarket 🃏`,
    '',
    'Me interesa:',
    itemLines,
    '',
    `Total: ~$${group.subtotal.toFixed(2)} USD`,
    '',
    '¿Están disponibles? ¡Gracias!',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// Genera URL de WhatsApp para un solo item (compra directa sin carrito)
export function buildDirectWhatsappUrl({
  whatsapp,
  sellerName,
  storeName,
  cardName,
  condition,
  quantity,
  priceUsd,
}: {
  whatsapp: string
  sellerName: string
  storeName: string | null
  cardName: string
  condition: CardCondition
  quantity: number
  priceUsd: number | null
}): string {
  const phone = whatsapp.replace(/\D/g, '')
  const total = ((priceUsd ?? 0) * quantity).toFixed(2)

  const message = [
    `¡Hola ${storeName ?? sellerName}! Vi tus cartas en TCGMarket 🃏`,
    '',
    `Me interesa: ${quantity}x ${cardName} (${condition}) - $${(priceUsd ?? 0).toFixed(2)} USD c/u`,
    `Total: ~$${total} USD`,
    '',
    '¿Está disponible? ¡Gracias!',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
