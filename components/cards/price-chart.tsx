'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { PtcgCard } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = '7D' | '30D'

interface StoredPoint {
  price_usd: number
  recorded_at: string
}

interface ChartPoint {
  date: string
  price: number
}

type CardmarketData = NonNullable<NonNullable<PtcgCard['cardmarket']>['prices']>

interface PriceChartProps {
  history: StoredPoint[]
  cardmarket?: CardmarketData | null
  eurToUsd?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type CmPrices = CardmarketData

/** Un precio es válido si existe y es mayor que 0 */
function validPrice(v: number | null | undefined): v is number {
  return v != null && v > 0
}

/**
 * Construye puntos de tendencia a partir de los promedios de Cardmarket (pokemontcg.io).
 * normal: trendPrice/avg1/avg7/avg30
 * reverseHolo: reverseHoloTrend/reverseHoloAvg1/7/30
 */
function buildCmPoints(cm: CmPrices, variant: 'normal' | 'reverseHolo', rate = 1): ChartPoint[] {
  const now = Date.now()
  const DAY = 86_400_000

  const entries: { offset: number; value: number | null | undefined }[] =
    variant === 'reverseHolo'
      ? [
          { offset: 30, value: cm.reverseHoloAvg30 },
          { offset: 7,  value: cm.reverseHoloAvg7 },
          { offset: 1,  value: cm.reverseHoloAvg1 },
          { offset: 0,  value: cm.reverseHoloTrend ?? cm.reverseHoloSell },
        ]
      : [
          { offset: 30, value: cm.avg30 },
          { offset: 7,  value: cm.avg7 },
          { offset: 1,  value: cm.avg1 },
          { offset: 0,  value: cm.trendPrice ?? cm.averageSellPrice },
        ]

  return entries
    .filter((e): e is { offset: number; value: number } => validPrice(e.value))
    .map(e => ({
      date: new Date(now - e.offset * DAY).toLocaleDateString('es-CO', {
        month: 'short', day: 'numeric',
      }),
      price: +(e.value * rate).toFixed(2),
    }))
}

function buildStoredPoints(history: StoredPoint[], days: number): ChartPoint[] {
  const cutoff = Date.now() - days * 86_400_000
  return history
    .filter(p => new Date(p.recorded_at).getTime() >= cutoff)
    .map(p => ({
      date: new Date(p.recorded_at).toLocaleDateString('es-CO', {
        month: 'short', day: 'numeric',
      }),
      price: Number(p.price_usd),
    }))
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/40 bg-gray-900 px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-bold text-yellow-400">${payload[0].value.toFixed(2)}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PriceChart({ history, cardmarket, eurToUsd = 1 }: PriceChartProps) {
  const [period, setPeriod] = useState<Period>('30D')

  const cm = cardmarket ?? null

  // Una variante "tiene datos" si genera al menos 2 puntos válidos (precio > 0)
  const holoPoints  = cm ? buildCmPoints(cm, 'reverseHolo', eurToUsd) : []
  const normalPoints = cm ? buildCmPoints(cm, 'normal', eurToUsd) : []
  const hasHolo   = holoPoints.length >= 2
  const hasNormal = normalPoints.length >= 2

  // Inicializar en la variante que tenga datos; si las dos tienen, preferir normal
  const defaultVariant: 'normal' | 'reverseHolo' = hasNormal ? 'normal' : 'reverseHolo'
  const [variant, setVariant] = useState<'normal' | 'reverseHolo'>(defaultVariant)

  // Datos para la gráfica
  const { chartData, isEstimated } = useMemo(() => {
    const days = period === '7D' ? 7 : 30
    const stored = buildStoredPoints(history, days)
    if (stored.length >= 3) return { chartData: stored, isEstimated: false }

    if (!cm) return { chartData: [], isEstimated: true }
    // Usar la variante activa; si no tiene puntos suficientes, caer al otro
    const activeVariant =
      variant === 'reverseHolo' && hasHolo ? 'reverseHolo'
      : variant === 'normal' && hasNormal ? 'normal'
      : hasNormal ? 'normal' : 'reverseHolo'
    const allPoints = buildCmPoints(cm, activeVariant, eurToUsd)
    const filtered = period === '7D' ? allPoints.slice(1) : allPoints
    return { chartData: filtered, isEstimated: true }
  }, [history, period, variant, cm, hasHolo, hasNormal])

  // Estadísticas
  const stats = useMemo(() => {
    if (chartData.length === 0) return null
    const prices = chartData.map(d => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const first = prices[0]
    const last = prices[prices.length - 1]
    const change = first > 0 ? ((last - first) / first) * 100 : 0
    return { min, max, last, change }
  }, [chartData])

  const trend =
    stats && stats.change > 0.5 ? 'up'
    : stats && stats.change < -0.5 ? 'down'
    : 'flat'

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up'     ? 'text-green-400'
    : trend === 'down' ? 'text-red-400'
    : 'text-muted-foreground'

  if (!cm) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Historial de precios
        </p>
        <p className="text-sm text-muted-foreground text-center py-6">
          No hay datos de precios disponibles para esta carta
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 divide-y divide-border/40">

      {/* ── Gráfica de tendencia ──────────────────────────────── */}
      {chartData.length >= 2 && (
        <div className="p-4 space-y-3">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tendencia de precio
              </p>
              {isEstimated && (
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  Cardmarket · convertido a USD
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {/* Variant toggle (solo si hay holo) */}
              {hasHolo && hasNormal && (
                <div className="flex gap-1 mr-2">
                  {(['normal', 'reverseHolo'] as const).map(v => (
                    <button key={v} onClick={() => setVariant(v)}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        variant === v
                          ? 'bg-purple-400/20 text-purple-300 font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}>
                      {v === 'reverseHolo' ? 'Rev. Holo' : 'Normal'}
                    </button>
                  ))}
                </div>
              )}
              {/* Period toggle */}
              {(['7D', '30D'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    period === p
                      ? 'bg-yellow-400/20 text-yellow-400 font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Precio + variación */}
          {stats && (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">${stats.last.toFixed(2)}</span>
              <span className={`flex items-center gap-0.5 text-sm font-medium ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                {Math.abs(stats.change).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({period === '7D' ? '7 días' : '30 días'})
              </span>
            </div>
          )}

          {/* Chart */}
          <div className="h-[110px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#facc15" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={['auto', 'auto']}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `$${v}`} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="price"
                  stroke="#facc15" strokeWidth={2}
                  fill="url(#priceGrad)" dot={false}
                  activeDot={{ r: 4, fill: '#facc15', strokeWidth: 0 }}
                  strokeDasharray={isEstimated ? '4 2' : undefined} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Min / Max */}
          {stats && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mín: <span className="font-medium text-foreground">${stats.min.toFixed(2)}</span></span>
              <span>Máx: <span className="font-medium text-foreground">${stats.max.toFixed(2)}</span></span>
            </div>
          )}
        </div>
      )}

      {/* ── Tabla de precios Cardmarket ───────────────────────── */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Precios de mercado
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <span>Cardmarket · USD</span>
            {/* updatedAt viene del nivel padre card.cardmarket, no en prices */}
          </div>
        </div>

        <div className="space-y-2">
          {hasNormal && (
            <PriceRow
              label="Normal"
              low={cm.lowPrice}
              avg={cm.averageSellPrice}
              trend={cm.trendPrice}
              avg7={cm.avg7}
              avg30={cm.avg30}
              rate={eurToUsd}
            />
          )}
          {hasHolo && (
            <PriceRow
              label="Rev. Holo"
              low={cm.reverseHoloLow}
              avg={cm.reverseHoloSell}
              trend={cm.reverseHoloTrend}
              avg7={cm.reverseHoloAvg7}
              avg30={cm.reverseHoloAvg30}
              rate={eurToUsd}
              highlight
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Price row sub-component ─────────────────────────────────────────────────

function PriceRow({
  label, low, avg, trend, avg7, avg30, rate = 1, highlight = false,
}: {
  label: string
  low?: number | null
  avg?: number | null
  trend?: number | null
  avg7?: number | null
  avg30?: number | null
  rate?: number
  highlight?: boolean
}) {
  const mainPrice = (trend ?? avg)
  if (!validPrice(mainPrice)) return null

  const fmt = (v: number | null | undefined) =>
    validPrice(v) ? `$${(v * rate).toFixed(2)}` : '—'

  return (
    <div className={`rounded-lg px-3 py-2.5 ${highlight ? 'bg-yellow-400/5 border border-yellow-400/15' : 'bg-muted/20'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${highlight ? 'text-yellow-300' : 'text-foreground'}`}>
          {label}
        </span>
        <span className={`text-base font-bold ${highlight ? 'text-yellow-400' : 'text-foreground'}`}>
          {fmt(mainPrice)}
          <span className="text-xs font-normal text-muted-foreground ml-1">tendencia</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { lbl: 'Bajo',     val: low },
          { lbl: 'Prom.',    val: avg },
          { lbl: 'Prom. 7D', val: avg7 },
          { lbl: 'Prom. 30D',val: avg30 },
        ].map(({ lbl, val }) => (
          <div key={lbl}>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">{lbl}</p>
            <p className="text-xs font-medium">{fmt(val)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
