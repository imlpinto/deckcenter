import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/15 border border-yellow-400/20 mb-6">
        <Zap className="h-8 w-8 text-yellow-400" />
      </div>
      <h1 className="text-6xl font-extrabold text-gold-gradient">404</h1>
      <p className="mt-3 text-xl font-semibold">Página no encontrada</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Esta página no existe o fue movida. Vuelve al inicio o busca la carta que estás buscando.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300">
            Ir al inicio
          </Button>
        </Link>
        <Link href="/buscar">
          <Button variant="outline">Buscar cartas</Button>
        </Link>
      </div>
    </div>
  )
}
