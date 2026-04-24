'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { PtcgCardBrief } from '@/types'

interface SearchBarProps {
  placeholder?: string
  autoFocus?: boolean
  size?: 'default' | 'lg'
}

export function SearchBar({
  placeholder = 'Busca una carta... ej: Charizard, Pikachu ex',
  autoFocus = false,
  size = 'default',
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PtcgCardBrief[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch sugerencias con debounce — TCGdex, sin API key
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: `name:${searchQuery.trim()}*`,
        pageSize: '8',
        orderBy: 'name',
      })
      const res = await fetch(`https://api.pokemontcg.io/v2/cards?${params}`)
      if (!res.ok) throw new Error('pokemontcg.io error')

      const json = await res.json()
      const data: PtcgCardBrief[] = json.data ?? []
      setSuggestions(Array.isArray(data) ? data : [])
      setIsOpen(true)
      setHighlightedIndex(-1)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce de 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return
    setIsOpen(false)
    router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  function handleSelectCard(card: TcgdexCardBrief) {
    setQuery(card.name)
    setIsOpen(false)
    router.push(`/carta/${card.id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectCard(suggestions[highlightedIndex])
        } else {
          handleSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const isLarge = size === 'lg'

  return (
    <div className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${
            isLarge ? 'h-5 w-5 left-4' : 'h-4 w-4 left-3'
          }`}
        />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full rounded-xl border-border/60 bg-card/80 backdrop-blur
            placeholder:text-muted-foreground/60 focus-visible:ring-yellow-400/50
            ${isLarge
              ? 'pl-12 pr-12 h-14 text-base shadow-xl shadow-black/30'
              : 'pl-9 pr-9 h-10 text-sm'
            }
          `}
        />
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 ${isLarge ? 'right-4' : ''}`}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && !isLoading && (
            <button
              onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); inputRef.current?.focus() }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/50"
        >
          <ul className="py-1 max-h-[420px] overflow-y-auto">
            {suggestions.map((card, index) => {
              return (
                <li key={`${card.id}-${index}`}>
                  <button
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      index === highlightedIndex ? 'bg-accent text-foreground' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleSelectCard(card)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {/* Imagen miniatura */}
                    <div className="flex-shrink-0 h-12 w-9 relative rounded overflow-hidden bg-muted">
                      {card.images?.small ? (
                        <Image
                          src={card.images.small}
                          alt={card.name}
                          fill
                          className="object-contain"
                          sizes="36px"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-muted" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{card.name}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        #{card.number} · {card.set.name}
                      </p>
                    </div>

                    <Badge variant="secondary" className="text-[10px] flex-shrink-0 hidden sm:flex">
                      {card.set.ptcgoCode ?? card.set.id}
                    </Badge>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Footer */}
          <div className="border-t border-border/40 px-3 py-2">
            <button
              onClick={() => handleSearch(query)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <Search className="h-3 w-3" />
              Ver todos los resultados para &quot;{query}&quot;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
