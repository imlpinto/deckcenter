import { Skeleton } from '@/components/ui/skeleton'

export default function CartaLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <Skeleton className="h-5 w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        {/* Imagen */}
        <div className="space-y-5">
          <Skeleton className="mx-auto w-64 lg:w-full max-w-xs aspect-[2/3] rounded-2xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        {/* Info */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
