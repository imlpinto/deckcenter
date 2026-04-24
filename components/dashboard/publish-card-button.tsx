'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddCardForm } from '@/components/dashboard/add-card-form'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface PublishCardButtonProps {
  variant?: 'default' | 'sm'
  className?: string
}

export function PublishCardButton({ variant = 'default', className }: PublishCardButtonProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {variant === 'sm' ? (
          <Button size="sm" className={`bg-yellow-400 text-slate-900 hover:bg-yellow-300 ${className ?? ''}`}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar carta
          </Button>
        ) : (
          <Button className={`bg-yellow-400 text-slate-900 hover:bg-yellow-300 w-full sm:w-auto ${className ?? ''}`}>
            <Plus className="mr-2 h-4 w-4" />
            Publicar carta
          </Button>
        )}
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
  )
}
