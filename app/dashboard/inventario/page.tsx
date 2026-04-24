import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AddCardForm } from '@/components/dashboard/add-card-form'
import { InventoryTable } from '@/components/dashboard/inventory-table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('inventory')
    .select(`
      id, quantity, condition, manual_price, use_market_price, notes, is_active, updated_at,
      card:tcg_cards ( name, image_url_sm, set_name, card_number, market_price_usd )
    `)
    .eq('seller_id', user!.id)
    .order('updated_at', { ascending: false })

  const inventory = items ?? []
  const activeCount = inventory.filter(i => i.is_active).length

  return (
    <div className="space-y-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mi Inventario</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} carta{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}{' '}
            · {inventory.length} en total
          </p>
        </div>

        {/* Botón publicar — Sheet en móvil, siempre visible */}
        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Publicar carta
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background">
            <SheetHeader>
              <SheetTitle>Agregar carta al inventario</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <AddCardForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Layout: tabla + formulario en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Formulario — solo visible en desktop como panel lateral */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="rounded-xl border border-border/40 bg-card/30 p-5 sticky top-24">
            <h2 className="font-semibold mb-4">Nueva publicación</h2>
            <AddCardForm />
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="lg:col-span-2">
          <InventoryTable items={inventory as unknown as Parameters<typeof InventoryTable>[0]['items']} />
        </div>

      </div>

    </div>
  )
}
