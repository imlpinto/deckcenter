import { Skeleton } from '@/components/ui/skeleton'

export default function BuscarLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Skeleton className="h-10 max-w-2xl rounded-xl" />
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-border/40">
            <Skeleton className="aspect-[2/3] w-full" />
            <div className="p-2.5 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
