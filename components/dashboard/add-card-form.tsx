'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Search, Loader2, Plus, X, ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addToInventory } from '@/lib/actions/inventory'
import { getCardImageLg } from '@/lib/pokemon-tcg'
import type { TcgdexCardBrief, TcgdexCard, CardCondition } from '@/types'

const CONDITIONS: { value: CardCondition; label: string; desc: string }[] = [
  { value: 'NM', label: 'NM', desc: 'Near Mint' },
  { value: 'LP', label: 'LP', desc: 'Lightly Played' },
  { value: 'MP', label: 'MP', desc: 'Moderately Played' },
  { value: 'HP', label: 'HP', desc: 'Heavily Played' },
  { value: 'DMG', label: 'DMG', desc: 'Damaged' },
]

export function AddCardForm({ onSuccess }: { onSuccess?: () => void }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TcgdexCardBrief[]>([])
  const [selectedCard, setSelectedCard] = useState<TcgdexCard | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useMarketPrice, setUseMarketPrice] = useState(false)
  const [condition, setCondition] = useState<CardCondition>('NM')
  const [photoMode, setPhotoMode] = useState<'catalog' | 'upload'>('catalog')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const searchCards = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return }
    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        name: q.trim(),
        'sort:field': 'name',
        'sort:order': 'ASC',
        'pagination:itemsPerPage': '8',
      })
      const res = await fetch(`https://api.tcgdex.net/v2/en/cards?${params}`)
      const data: TcgdexCardBrief[] = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
    } catch { setSuggestions([]) }
    finally { setIsSearching(false) }
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setSelectedCard(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchCards(val), 300)
  }

  async function handleSelectCard(brief: TcgdexCardBrief) {
    setSuggestions([])
    setQuery(brief.name)
    setIsSearching(true)
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${brief.id}`)
      const card: TcgdexCard = await res.json()
      setSelectedCard(card)
      // Auto-activar precio de mercado si la carta lo tiene
      const price =
        card.tcgplayer?.prices?.holofoil?.market ??
        card.tcgplayer?.prices?.normal?.market ??
        card.cardmarket?.prices?.trendPrice ??
        null
      setUseMarketPrice(!!price)
    } catch { setError('No se pudo cargar el detalle de la carta') }
    finally { setIsSearching(false) }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedCard) return
    setIsSubmitting(true)
    setError(null)
    formData.set('api_id', selectedCard.id)
    formData.set('use_market_price', String(useMarketPrice))
    // Adjuntar el archivo desde estado (el input puede estar desmontado)
    if (photoMode === 'upload' && selectedFile) {
      formData.set('photo', selectedFile)
    } else {
      formData.delete('photo')
    }

    const result = await addToInventory(formData)
    setIsSubmitting(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setSelectedCard(null)
      setQuery('')
      setPhotoMode('catalog')
      setSelectedFile(null)
      setFilePreview(null)
      setTimeout(() => { setSuccess(false); onSuccess?.() }, 1500)
    }
  }

  const marketPrice = selectedCard?.tcgplayer?.prices
    ? (selectedCard.tcgplayer.prices.holofoil?.market ??
       selectedCard.tcgplayer.prices.normal?.market ??
       selectedCard.cardmarket?.prices?.trendPrice ?? null)
    : null

  return (
    <div className="space-y-6">

      {/* Buscador de carta */}
      <div>
        <Label className="mb-2 block">Buscar carta</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleQueryChange}
            placeholder="Escribe el nombre... ej: Charizard"
            className="pl-9 pr-9"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {query && !isSearching && (
            <button
              onClick={() => { setQuery(''); setSelectedCard(null); setSuggestions([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown */}
          {suggestions.length > 0 && !selectedCard && (
            <div className="absolute top-full mt-1 w-full z-20 rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden">
              <ul className="max-h-64 overflow-y-auto py-1">
                {suggestions.map((card, i) => (
                  <li key={`${card.id}-${i}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectCard(card)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                    >
                      <div className="h-10 w-8 relative flex-shrink-0 rounded overflow-hidden bg-muted">
                        {card.image && (
                          <Image src={`${card.image}/low.webp`} alt={card.name} fill className="object-cover" sizes="32px" unoptimized />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{card.name}</p>
                        <p className="text-xs text-muted-foreground">#{card.localId} · {card.id}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Preview de carta seleccionada */}
      {selectedCard && (
        <form action={handleSubmit} className="space-y-5">

          <div className="flex gap-4 rounded-xl bg-muted/30 border border-border/40 p-4">
            {/* Imagen */}
            <div className="relative h-28 w-20 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
              {selectedCard.image ? (
                <Image
                  src={getCardImageLg(selectedCard.image) ?? ''}
                  alt={selectedCard.name}
                  fill className="object-cover" sizes="80px" unoptimized
                />
              ) : (
                <div className="h-full bg-muted" />
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{selectedCard.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{selectedCard.set?.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedCard.rarity && (
                  <Badge variant="secondary" className="text-xs">{selectedCard.rarity}</Badge>
                )}
                {selectedCard.types?.map(t => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
                {selectedCard.hp && (
                  <Badge variant="outline" className="text-xs">HP {selectedCard.hp}</Badge>
                )}
              </div>
              {marketPrice && (
                <p className="text-xs text-yellow-400 mt-2">
                  Precio de mercado: <span className="font-semibold">${marketPrice.toFixed(2)} USD</span>
                </p>
              )}
            </div>
          </div>

          {/* Foto de la carta */}
          <div>
            <Label className="mb-2 block">Foto de la carta</Label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setPhotoMode('catalog'); handleRemoveFile() }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-all ${
                  photoMode === 'catalog'
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-border/60 text-muted-foreground hover:border-border'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Foto del catálogo
              </button>
              <button
                type="button"
                onClick={() => setPhotoMode('upload')}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-all ${
                  photoMode === 'upload'
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-border/60 text-muted-foreground hover:border-border'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Subir mi foto
              </button>
            </div>

            {photoMode === 'catalog' && selectedCard.image && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border/40 p-3">
                <div className="relative h-14 w-10 flex-shrink-0 rounded overflow-hidden">
                  <Image
                    src={`${selectedCard.image}/low.webp`}
                    alt={selectedCard.name}
                    fill className="object-cover" sizes="40px" unoptimized
                  />
                </div>
                <p className="text-xs text-muted-foreground">Se usará la imagen oficial del catálogo TCGdex.</p>
              </div>
            )}

            {/* Input siempre montado para mantener el File en ref */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {photoMode === 'upload' && (
              <div>
                {!filePreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-6 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Haz clic para seleccionar una foto</span>
                    <span className="text-xs text-muted-foreground/60">JPG, PNG, WEBP — máx. 5 MB</span>
                  </button>
                ) : (
                  <div className="relative inline-block">
                    <div className="relative h-32 w-24 rounded-xl overflow-hidden border border-border/60 shadow-lg">
                      <Image src={filePreview} alt="Vista previa" fill className="object-cover" sizes="96px" unoptimized />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-white hover:bg-destructive/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Condición */}
          <div>
            <Label className="mb-2 block">Condición</Label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCondition(c.value)}
                  className={`rounded-lg border px-3 py-2 text-xs transition-all ${
                    condition === c.value
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-border/60 text-muted-foreground hover:border-border'
                  }`}
                >
                  <span className="font-semibold">{c.label}</span>
                  <span className="hidden sm:inline ml-1 opacity-70">— {c.desc}</span>
                </button>
              ))}
            </div>
            <input type="hidden" name="condition" value={condition} />
          </div>

          {/* Cantidad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity" className="mb-1.5 block">Cantidad</Label>
              <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" required />
            </div>

            {/* Precio */}
            <div>
              <Label htmlFor="manual_price" className="mb-1.5 block">
                Precio (USD)
                {useMarketPrice && (
                  <span className="ml-2 text-xs text-yellow-400 font-normal">sincronizado</span>
                )}
              </Label>
              <Input
                id="manual_price"
                name="manual_price"
                type="number"
                step="0.01"
                min="0"
                placeholder={marketPrice ? `Mercado: $${marketPrice.toFixed(2)}` : '0.00'}
                disabled={useMarketPrice}
                className="disabled:opacity-50"
              />
            </div>
          </div>

          {/* Sincronizar con mercado */}
          {marketPrice && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useMarketPrice}
                onChange={e => setUseMarketPrice(e.target.checked)}
                className="h-4 w-4 rounded accent-yellow-400"
              />
              <span className="text-sm text-muted-foreground">
                Usar precio de mercado automáticamente{' '}
                <span className="text-yellow-400 font-medium">(${marketPrice.toFixed(2)} USD)</span>
              </span>
            </label>
          )}

          {/* Notas opcionales */}
          <div>
            <Label htmlFor="notes" className="mb-1.5 block">
              Notas <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Ej: Foil rayado en borde, primera edición..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
              Carta agregada al inventario exitosamente
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" /> Agregar al inventario</>
            )}
          </Button>
        </form>
      )}

    </div>
  )
}
