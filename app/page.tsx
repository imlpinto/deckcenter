import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Zap, MessageCircle, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchBar } from '@/components/search/search-bar'
import { getCardById } from '@/lib/pokemon-tcg'
import { createClient } from '@/lib/supabase/server'
import { CURATED_CARD_IDS } from '@/lib/curated-cards'

type PopularCard = {
  api_id: string
  name: string
  image_url_sm: string | null
  market_price_usd: number | null
  view_count: number
  fromPlatform: boolean
}

const TRENDING_TARGET = 8

// Cartas más vistas/buscadas en la plataforma este mes.
// Si no hay suficiente actividad real (< 8 cartas), completa con cartas curadas
// para siempre mostrar exactamente 8.
async function getPopularCards(): Promise<PopularCard[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('card_views')
    .select('api_id, view_count, card:tcg_cards!inner(name, image_url_sm, market_price_usd)')
    .order('view_count', { ascending: false })
    .limit(TRENDING_TARGET)

  type Row = {
    api_id: string
    view_count: number
    card: { name: string; image_url_sm: string | null; market_price_usd: number | null }
  }

  const platformCards: PopularCard[] = data && data.length > 0
    ? (data as unknown as Row[]).map(row => ({
        api_id: row.api_id,
        name: row.card.name,
        image_url_sm: row.card.image_url_sm,
        market_price_usd: row.card.market_price_usd,
        view_count: row.view_count,
        fromPlatform: true,
      }))
    : []

  // Si ya tenemos 8 cartas reales, devolver solo esas
  if (platformCards.length >= TRENDING_TARGET) return platformCards.slice(0, TRENDING_TARGET)

  // Completar con cartas curadas hasta llegar a 8
  // Excluir IDs que ya están en los datos reales
  const existingIds = new Set(platformCards.map(c => c.api_id))
  const needed = TRENDING_TARGET - platformCards.length
  const candidateIds = CURATED_CARD_IDS.filter(id => !existingIds.has(id))

  try {
    const results = await Promise.allSettled(
      candidateIds.map(id => getCardById(id))
    )
    const curatedCards: PopularCard[] = results
      .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof getCardById>>>> =>
        r.status === 'fulfilled' && r.value != null
      )
      .map(r => r.value)
      .filter(card => card.images?.small != null)
      .slice(0, needed)
      .map(card => ({
        api_id: card.id,
        name: card.name,
        image_url_sm: card.images.small,
        market_price_usd: null,
        view_count: 0,
        fromPlatform: false,
      }))

    return [...platformCards, ...curatedCards]
  } catch {
    return platformCards
  }
}

export default async function HomePage() {
  const popularCards = await getPopularCards()

  return (
    <div className="flex flex-col">

      {/* ===== HERO SECTION ===== */}
      <section className="relative -mt-20">
        {/* Fondo con gradiente y grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(250,204,21,0.15),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 pt-36 pb-20 sm:pt-44 sm:pb-28">
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

      {/* ===== CARTAS POPULARES ===== */}
      {popularCards.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-border/40">
          <div className="w-full px-4 sm:px-6 lg:px-8">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Tendencias en Deckcenter</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {popularCards.some(c => c.fromPlatform)
                    ? 'Las más buscadas y compradas este mes'
                    : 'Las más populares del TCG este mes'}
                </p>
              </div>
              <Link href="/buscar">
                <Button variant="ghost" size="sm" className="gap-1 text-yellow-400 hover:text-yellow-300">
                  Explorar <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Grid de cartas */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
              {popularCards.map((card, i) => (
                <Link key={card.api_id} href={`/carta/${card.api_id}`} className={i >= 6 ? 'hidden sm:block' : ''}>
                  <div className="group relative rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/5 hover:-translate-y-0.5">
                    <div className="relative aspect-[5/7] bg-muted overflow-hidden">
                      {card.image_url_sm ? (
                        <Image
                          src={card.image_url_sm}
                          alt={card.name}
                          fill
                          className="object-contain transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Sin imagen</span>
                        </div>
                      )}
                      {card.fromPlatform && card.view_count > 0 && (
                        <div className="absolute top-1 right-1 bg-yellow-400/90 text-slate-900 text-[9px] font-bold rounded px-1 py-0.5 leading-none">
                          {card.view_count >= 1000 ? `${(card.view_count / 1000).toFixed(1)}k` : card.view_count} 👁
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate">{card.name}</p>
                      {card.market_price_usd != null && card.market_price_usd > 0 && (
                        <p className="text-[11px] text-yellow-400 font-medium mt-0.5">
                          ${card.market_price_usd.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="py-14 sm:py-20 border-t border-border/40 bg-card/30">
        <div className="w-full px-4 sm:px-6 lg:px-8">

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
        <div className="w-full px-4 sm:px-6 lg:px-8">

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
