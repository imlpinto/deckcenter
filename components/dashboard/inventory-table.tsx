'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Trash2, ToggleLeft, ToggleRight, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { removeFromInventory, updateInventoryItem } from '@/lib/actions/inventory'
import type { CardCondition } from '@/types'

interface InventoryItem {
  id: string
  quantity: number
  condition: CardCondition
  manual_price: number | null
  use_market_price: boolean
  notes: string | null
  is_active: boolean
  updated_at: string
  card: {
    name: string
    image_url_sm: string | null
    set_name: string | null
    card_number: string | null
    market_price_usd: number | null
  } | null
}

const CONDITION_COLOR: Record<string, string> = {
  NM:  'border-green-400/40 text-green-400',
  LP:  'border-lime-400/40 text-lime-400',
  MP:  'border-yellow-400/40 text-yellow-400',
  HP:  'border-orange-400/40 text-orange-400',
  DMG: 'border-red-400/40 text-red-400',
}

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editQty, setEditQty] = useState('')
  const [isPending, startTransition] = useTransition()

  function startEdit(item: InventoryItem) {
    setEditingId(item.id)
    setEditPrice(item.manual_price?.toString() ?? '')
    setEditQty(item.quantity.toString())
  }

  function cancelEdit() {
    setEditingId(null)
    setEditPrice('')
    setEditQty('')
  }

  function saveEdit(item: InventoryItem) {
    startTransition(async () => {
      await updateInventoryItem(item.id, {
        manual_price: editPrice ? parseFloat(editPrice) : null,
        quantity: parseInt(editQty, 10),
      })
      setEditingId(null)
    })
  }

  function toggleActive(item: InventoryItem) {
    startTransition(async () => {
      await updateInventoryItem(item.id, { is_active: !item.is_active })
    })
  }

  function handleRemove(id: string) {
    if (!confirm('¿Eliminar esta carta del inventario?')) return
    startTransition(async () => {
      await removeFromInventory(id)
    })
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No hay cartas en tu inventario todavía.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">

      {/* Vista desktop — tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Carta</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cond.</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio (USD)</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ref. mercado</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const card = item.card
              const isEditing = editingId === item.id
              const effectivePrice = item.use_market_price
                ? card?.market_price_usd
                : item.manual_price

              return (
                <tr
                  key={item.id}
                  className={`border-b border-border/20 last:border-0 transition-colors ${
                    item.is_active ? 'hover:bg-muted/20' : 'opacity-50 hover:bg-muted/10'
                  }`}
                >
                  {/* Carta */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-7 relative flex-shrink-0 rounded overflow-hidden bg-muted">
                        {card?.image_url_sm && (
                          <Image src={card.image_url_sm} alt={card.name} fill className="object-cover" sizes="28px" unoptimized />
                        )}
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[180px]">{card?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{card?.set_name} · {card?.card_number}</p>
                      </div>
                    </div>
                  </td>

                  {/* Condición */}
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={CONDITION_COLOR[item.condition] ?? ''}>
                      {item.condition}
                    </Badge>
                  </td>

                  {/* Cantidad */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <Input
                        type="number" min="0" value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        className="h-7 w-16 text-right text-xs ml-auto"
                      />
                    ) : (
                      <span>{item.quantity}</span>
                    )}
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-3 text-right">
                    {isEditing && !item.use_market_price ? (
                      <Input
                        type="number" step="0.01" min="0" value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="h-7 w-24 text-right text-xs ml-auto"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className={effectivePrice ? 'text-yellow-400 font-medium' : 'text-muted-foreground'}>
                        {effectivePrice ? `$${effectivePrice.toFixed(2)}` : '—'}
                        {item.use_market_price && (
                          <span className="text-xs text-muted-foreground ml-1">(auto)</span>
                        )}
                      </span>
                    )}
                  </td>

                  {/* Referencia mercado */}
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {card?.market_price_usd ? `$${card.market_price_usd.toFixed(2)}` : '—'}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(item)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={item.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {item.is_active
                        ? <ToggleRight className="h-5 w-5 text-green-400" />
                        : <ToggleLeft className="h-5 w-5" />
                      }
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300" onClick={() => saveEdit(item)} disabled={isPending}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={() => handleRemove(item.id)} disabled={isPending}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vista móvil — cards */}
      <div className="md:hidden divide-y divide-border/20">
        {items.map((item) => {
          const card = item.card
          const effectivePrice = item.use_market_price ? card?.market_price_usd : item.manual_price
          return (
            <div key={item.id} className={`p-4 flex items-center gap-3 ${!item.is_active ? 'opacity-50' : ''}`}>
              <div className="h-14 w-10 relative flex-shrink-0 rounded overflow-hidden bg-muted">
                {card?.image_url_sm && (
                  <Image src={card.image_url_sm} alt={card.name ?? ''} fill className="object-cover" sizes="40px" unoptimized />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{card?.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] ${CONDITION_COLOR[item.condition] ?? ''}`}>{item.condition}</Badge>
                  <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                </div>
                <p className="text-xs text-yellow-400 font-medium mt-0.5">
                  {effectivePrice ? `$${effectivePrice.toFixed(2)} USD` : 'Sin precio'}
                  {item.use_market_price && <span className="text-muted-foreground ml-1">(auto)</span>}
                </p>
                {card?.market_price_usd && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Ref. mercado: ${card.market_price_usd.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(item)} disabled={isPending}>
                  {item.is_active ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={() => handleRemove(item.id)} disabled={isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
