'use client'

import Image from 'next/image'
import { ShoppingCart, Trash2, Plus, Minus, MessageCircle, Package } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function CartSheet() {
  const { items, totalItems, removeItem, updateQuantity, getSellerGroups } = useCart()
  const groups = getSellerGroups()
  const grandTotal = groups.reduce((sum, g) => sum + g.subtotal, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {totalItems > 9 ? '9+' : totalItems}
            </Badge>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">{totalItems} items</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          /* Estado vacío */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <Package className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Tu carrito está vacío</p>
            <p className="text-sm text-muted-foreground">
              Busca una carta y agrégala para coordinar la compra por WhatsApp
            </p>
          </div>
        ) : (
          <>
            {/* Lista de items agrupados por vendedor */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {groups.map((group) => (
                <div key={group.sellerId}>
                  {/* Cabecera del vendedor */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {group.storeName ?? group.sellerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Subtotal: <span className="text-yellow-400 font-medium">${group.subtotal.toFixed(2)} USD</span>
                      </p>
                    </div>
                    {/* Botón WhatsApp por vendedor */}
                    {group.whatsappUrl ? (
                      <a href={group.whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </Button>
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Sin WhatsApp
                      </Badge>
                    )}
                  </div>

                  {/* Items del vendedor */}
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.inventoryId} className="flex gap-3 rounded-xl bg-muted/30 p-3">
                        {/* Imagen */}
                        <div className="h-14 w-10 relative flex-shrink-0 rounded overflow-hidden bg-muted">
                          {item.cardImage && (
                            <Image src={item.cardImage} alt={item.cardName} fill className="object-cover" sizes="40px" unoptimized />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.cardName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">{item.condition}</Badge>
                            {item.priceUsd && (
                              <span className="text-xs text-yellow-400">${item.priceUsd.toFixed(2)}</span>
                            )}
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
                              className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
                              disabled={item.quantity >= item.availableQuantity}
                              className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeItem(item.inventoryId)}
                              className="ml-auto text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="mt-4" />
                </div>
              ))}
            </div>

            {/* Footer con total y acción principal */}
            <div className="border-t border-border/40 pt-4 space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>Total estimado</span>
                <span className="text-yellow-400">${grandTotal.toFixed(2)} USD</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Usa los botones <strong>WhatsApp</strong> de cada vendedor para coordinar el pago y envío directamente.
              </p>
              {/* Si solo hay un vendedor, botón grande */}
              {groups.length === 1 && groups[0].whatsappUrl && (
                <a href={groups[0].whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-500 text-white gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Contactar por WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
