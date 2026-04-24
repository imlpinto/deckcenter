import { Skeleton } from '@/components/ui/skeleton'

export default function BuscarLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* SearchBar skeleton */}
      <Skeleton className="h-10 max-w-2xl rounded-xl" />

      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full sm:w-[150px] rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-[180px] rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-[160px] rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-[180px] rounded-lg" />
      </div>

      {/* Header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Grid skeleton — mismas columnas que la vista real */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-border/40">
            <Skeleton className="aspect-[5/7] w-full" />
            <div className="p-2 space-y-1.5">
              <Skeleton className="h-2.5 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
