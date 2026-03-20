import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Zap, MessageCircle, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchBar } from '@/components/search/search-bar'
import { searchCards, getCardImageSm } from '@/lib/pokemon-tcg'
import type { TcgdexCardBrief } from '@/types'

// Cartas populares para mostrar en la sección hero (se cachean 1h en Next.js)
async function getFeaturedCards(): Promise<TcgdexCardBrief[]> {
  try {
    const data = await searchCards('Charizard', 1, 4)
    return data.data.slice(0, 4)
  } catch {
    return []
  }
}

export default async function HomePage() {
  const featuredCards = await getFeaturedCards()

  return (
    <div className="flex flex-col">

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Fondo con gradiente y grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(250,204,21,0.15),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="flex flex-col items-center text-center">

            {/* Badge superior */}
            <Badge
              variant="outline"
              className="mb-6 gap-2 border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-xs"
            >
              <Zap className="h-3 w-3" />
              El marketplace TCG más completo
            </Badge>

            {/* Título principal */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl max-w-3xl">
              Encuentra{' '}
              <span className="text-gold-gradient">cualquier carta</span>
              {' '}al mejor precio
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Compara precios de múltiples vendedores verificados con referencia
              del mercado internacional. Compra directo por WhatsApp, sin intermediarios.
            </p>

            {/* Buscador central */}
            <div className="mt-8 w-full max-w-2xl">
              <SearchBar size="lg" autoFocus={false} />
              {/* Búsquedas populares */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Popular:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <Link
                    key={term}
                    href={`/buscar?q=${encodeURIComponent(term)}`}
                    className="text-xs text-muted-foreground border border-border/40 rounded-full px-2.5 py-1 hover:border-yellow-400/40 hover:text-yellow-400 transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-lg w-full">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl font-bold text-gold-gradient">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ===== CARTAS DESTACADAS ===== */}
      {featuredCards.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Cartas Populares</h2>
                <p className="text-sm text-muted-foreground mt-1">Charizard — Siempre en demanda</p>
              </div>
              <Link href="/buscar?q=charizard">
                <Button variant="ghost" size="sm" className="gap-1 text-yellow-400 hover:text-yellow-300">
                  Ver todas <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Grid de cartas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredCards.map((card) => {
                const imgSrc = getCardImageSm(card.image)
                return (
                  <Link key={card.id} href={`/carta/${card.id}`}>
                    <div className="group relative rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/5 hover:-translate-y-0.5">
                      {/* Imagen */}
                      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={card.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Sin imagen</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-2.5">
                        <p className="text-xs font-semibold truncate">{card.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          #{card.localId}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

          </div>
        </section>
      )}

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="py-14 sm:py-20 border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold">¿Cómo funciona?</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Comprar cartas nunca fue tan fácil
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                {/* Número */}
                <div className="relative mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 border border-yellow-400/20">
                    <step.icon className="h-7 w-7 text-yellow-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-slate-900">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===== PARA VENDEDORES ===== */}
      <section className="py-14 sm:py-20 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          <div className="rounded-2xl bg-gradient-to-br from-yellow-400/10 via-card to-card border border-yellow-400/20 p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">

              {/* Texto */}
              <div className="flex-1 text-center sm:text-left">
                <Badge className="mb-3 bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
                  Para Vendedores
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Publica tu inventario{' '}
                  <span className="text-gold-gradient">en minutos</span>
                </h2>
                <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg">
                  Registra tus cartas con datos reales (imagen, set, rareza) traídos
                  automáticamente de la API de Pokémon. Define tu precio o sincroniza
                  con el mercado de TCGPlayer.
                </p>

                <ul className="mt-5 space-y-2 text-sm">
                  {SELLER_BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 justify-center sm:justify-start">
                      <ShieldCheck className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Link href="/auth/registro">
                    <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300 w-full sm:w-auto">
                      Empezar a vender gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Ver el panel
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Decorativo */}
              <div className="hidden lg:flex flex-col gap-3 flex-shrink-0 w-56">
                {MINI_STATS.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-background/60 border border-border/40 p-4">
                    <div className="text-2xl font-bold text-gold-gradient">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

// ===== Datos estáticos =====

const POPULAR_SEARCHES = [
  'Pikachu', 'Mewtwo', 'Charizard ex', 'Umbreon VMAX', 'Rayquaza'
]

const STATS = [
  { value: '10K+', label: 'Cartas listadas' },
  { value: '200+', label: 'Vendedores' },
  { value: '99%', label: 'Satisfacción' },
]

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: 'Busca tu carta',
    description:
      'Escribe el nombre de la carta que buscas. Ve todos los vendedores que la tienen, con precios comparados al mercado internacional.',
  },
  {
    icon: TrendingUp,
    title: 'Compara precios',
    description:
      'Elige el mejor precio y la condición que prefieres (Near Mint, Lightly Played, etc). Precios de referencia en USD de TCGPlayer.',
  },
  {
    icon: MessageCircle,
    title: 'Contacta por WhatsApp',
    description:
      'Con un clic, abre WhatsApp con un mensaje prellenado para el vendedor. Acuerda el pago y el envío directamente con él.',
  },
]

const SELLER_BENEFITS = [
  'Registro gratuito sin comisiones',
  'Datos de carta (imagen, set, rareza) automáticos',
  'Sincroniza precios con TCGPlayer',
  'Panel de gestión de inventario',
]

const MINI_STATS = [
  { value: 'Gratis', label: 'Para siempre en MVP' },
  { value: '0%', label: 'Comisión por venta' },
  { value: '5 min', label: 'Para publicar tu primera carta' },
]
