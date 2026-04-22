'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Loader2, X, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { TcgdexCardBrief } from '@/types'
import { getCardImageSm } from '@/lib/pokemon-tcg'

export function NavSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TcgdexCardBrief[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  // Mobile: whether the search input is expanded
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileOverlayRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        name: searchQuery.trim(),
        'sort:field': 'name',
        'sort:order': 'ASC',
        'pagination:itemsPerPage': '8',
      })
      const res = await fetch(`https://api.tcgdex.net/v2/en/cards?${params}`)
      if (!res.ok) throw new Error('TCGdex error')
      const data: TcgdexCardBrief[] = await res.json()
      setSuggestions(Array.isArray(data) ? data : [])
      setIsOpen(true)
      setHighlightedIndex(-1)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const inContainer = containerRef.current?.contains(target)
      const inOverlay = mobileOverlayRef.current?.contains(target)
      if (!inContainer && !inOverlay) {
        setIsOpen(false)
        setMobileExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectCard(card: TcgdexCardBrief) {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    setMobileExpanded(false)
    router.push(`/carta/${card.id}`)
  }

  function handleViewAll() {
    if (!query.trim()) return
    setIsOpen(false)
    setMobileExpanded(false)
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) return
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) return
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectCard(suggestions[highlightedIndex])
        } else if (query.trim()) {
          // Enter without a card selected → go to search page
          handleViewAll()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setMobileExpanded(false)
        inputRef.current?.blur()
        break
    }
  }

  function handleClear() {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  function handleMobileOpen() {
    setMobileExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div ref={containerRef} className="relative">

      {/* ── Desktop search (md+) ── */}
      <div className="hidden md:block relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder="Buscar carta..."
          className="pl-8 pr-8 h-9 w-52 lg:w-64 text-sm rounded-lg border-border/50 bg-muted/40 focus-visible:bg-card focus-visible:w-72 transition-all duration-200 focus-visible:ring-yellow-400/50"
        />
        {(isLoading || query) && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {isLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              : <button onClick={handleClear} className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
            }
          </div>
        )}
      </div>

      {/* ── Mobile: icono cuando está cerrado ── */}
      <div className="md:hidden">
        {!mobileExpanded && (
          <button
            onClick={handleMobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── Mobile: overlay full-width sobre el navbar ── */}
      {mobileExpanded && (
        <div ref={mobileOverlayRef} className="md:hidden fixed inset-x-0 top-0 z-50 h-20 bg-background/95 backdrop-blur-xl border-b border-border/40 flex items-center px-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
              placeholder="Buscar carta..."
              className="w-full pl-9 pr-10 h-10 text-sm rounded-xl border-border/50 bg-muted/40 focus-visible:ring-yellow-400/50"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                : <button
                    onClick={() => {
                      if (query) {
                        handleClear()
                      } else {
                        setMobileExpanded(false)
                        setIsOpen(false)
                      }
                    }}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Cerrar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Dropdown ── */}
      {isOpen && suggestions.length > 0 && (
        <div className={`z-50 overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/50
          ${mobileExpanded
            ? 'md:hidden fixed inset-x-4 top-20'
            : 'absolute top-full right-0 mt-2 w-80'
          }`}>
          <ul className="py-1 max-h-[400px] overflow-y-auto">
            {suggestions.map((card, index) => {
              const imgSrc = getCardImageSm(card.image)
              const setCode = card.id.split('-')[0].toUpperCase()
              return (
                <li key={`${card.id}-${index}`}>
                  <button
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                      index === highlightedIndex ? 'bg-accent text-foreground' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleSelectCard(card)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex-shrink-0 h-11 w-8 relative rounded overflow-hidden bg-muted">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={card.name}
                          fill
                          className="object-cover"
                          sizes="32px"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{card.name}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {setCode} · #{card.localId}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-border/40 px-3 py-2">
            <button
              onClick={handleViewAll}
              className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span>Ver todos los resultados para <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span></span>
              <ArrowRight className="h-3 w-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
