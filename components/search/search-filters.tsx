'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { SlidersHorizontal, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'

export type FilterOptions = {
  sets: string[]
  rarities: string[]
}

export type ActiveFilters = {
  set: string
  rarity: string
  supertype: string
  sort: string
}

const SUPERTYPES = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'Pokémon', label: 'Pokémon' },
  { value: 'Trainer', label: 'Entrenador' },
  { value: 'Energy', label: 'Energía' },
]

const SORT_OPTIONS = [
  { value: 'default', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre A–Z' },
]

interface SearchFiltersProps {
  options: FilterOptions
  active: ActiveFilters
}

export function SearchFilters({ options, active }: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // ── Pending state para mobile (aplica solo al presionar "Aplicar") ──
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pending, setPending] = useState<ActiveFilters>({ ...active })

  // Sincronizar pending cuando cambian los filtros activos (ej: limpiar desde desktop)
  useEffect(() => {
    setPending({ ...active })
  }, [active.set, active.rarity, active.supertype, active.sort])

  // ── Helpers ──────────────────────────────────────────────────────────
  const buildParams = useCallback((filters: ActiveFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    const entries: [string, string][] = [
      ['supertype', filters.supertype],
      ['set', filters.set],
      ['rarity', filters.rarity],
      ['sort', filters.sort],
    ]
    for (const [key, val] of entries) {
      if (val) params.set(key, val)
      else params.delete(key)
    }
    params.delete('page')
    return params.toString()
  }, [searchParams])

  // Desktop: actualiza URL de inmediato
  const updateImmediate = useCallback((key: string, value: string) => {
    const next = { ...active, [key]: value }
    router.push(`${pathname}?${buildParams(next)}`)
  }, [router, pathname, active, buildParams])

  // Mobile: aplica todos los pending y cierra el sheet
  const applyMobile = useCallback(() => {
    router.push(`${pathname}?${buildParams(pending)}`)
    setSheetOpen(false)
  }, [router, pathname, pending, buildParams])

  const clearAll = useCallback(() => {
    const empty: ActiveFilters = { set: '', rarity: '', supertype: '', sort: '' }
    setPending(empty)
    const params = new URLSearchParams(searchParams.toString())
    for (const key of ['set', 'rarity', 'supertype', 'sort', 'page']) params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
    setSheetOpen(false)
  }, [router, pathname, searchParams])

  const activeCount = [active.set, active.rarity, active.supertype, active.sort].filter(Boolean).length
  const hasActive = activeCount > 0

  // ── Mobile: botón + Sheet ─────────────────────────────────────────────
  const MobileTrigger = (
    <div className="lg:hidden flex-shrink-0">
      <Button
        variant="outline"
        size="icon"
        className="relative h-10 w-10 flex-shrink-0"
        onClick={() => { setPending({ ...active }); setSheetOpen(true) }}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-slate-900 leading-none">
            {activeCount}
          </span>
        )}
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left">Filtros</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 py-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</Label>
              <Select value={pending.supertype || 'all'} onValueChange={v => setPending(p => ({ ...p, supertype: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPERTYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Expansión */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Expansión</Label>
              <Select value={pending.set || 'all'} onValueChange={v => setPending(p => ({ ...p, set: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las expansiones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las expansiones</SelectItem>
                  {options.sets.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Rareza */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Rareza</Label>
              <Select value={pending.rarity || 'all'} onValueChange={v => setPending(p => ({ ...p, rarity: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las rarezas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las rarezas</SelectItem>
                  {options.rarities.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Ordenar por</Label>
              <Select value={pending.sort || 'default'} onValueChange={v => setPending(p => ({ ...p, sort: v === 'default' ? '' : v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-2 pb-4">
            {hasActive && (
              <Button variant="outline" onClick={clearAll} className="flex-1 gap-1">
                <X className="h-3.5 w-3.5" />
                Limpiar
              </Button>
            )}
            <Button
              onClick={applyMobile}
              className={`bg-yellow-400 text-slate-900 hover:bg-yellow-300 gap-1 ${hasActive ? 'flex-1' : 'w-full'}`}
            >
              <Check className="h-3.5 w-3.5" />
              Aplicar filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

  // ── Desktop: fila inline ──────────────────────────────────────────────
  const DesktopFilters = (
    <div className="hidden lg:flex flex-wrap items-center gap-2 min-w-0">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-shrink-0">
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </div>

      <Select value={active.supertype || 'all'} onValueChange={v => updateImmediate('supertype', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {SUPERTYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={active.set || 'all'} onValueChange={v => updateImmediate('set', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Expansión" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las expansiones</SelectItem>
          {options.sets.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={active.rarity || 'all'} onValueChange={v => updateImmediate('rarity', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Rareza" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las rarezas</SelectItem>
          {options.rarities.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={active.sort || 'default'} onValueChange={v => updateImmediate('sort', v === 'default' ? '' : v)}>
        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-xs text-muted-foreground hover:text-foreground h-9 px-2">
          <X className="h-3 w-3" />
          Limpiar
        </Button>
      )}
    </div>
  )

  return (
    <>
      {MobileTrigger}
      {DesktopFilters}
    </>
  )
}
