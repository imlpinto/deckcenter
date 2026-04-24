import Link from 'next/link'
import { Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-background">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">

          {/* Marca */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400">
                <Zap className="h-4 w-4 text-slate-900" />
              </div>
              <span className="font-bold text-gold-gradient">Deckcenter</span>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              El marketplace de cartas coleccionables.
              Encuentra y vende con precios de referencia del mercado internacional.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Plataforma
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { href: '/buscar', label: 'Buscar Cartas' },
                { href: '/vendedores', label: 'Vendedores' },
                { href: '/tiendas', label: 'Tiendas Aliadas' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vendedores */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendedores
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { href: '/auth/registro', label: 'Registrarse' },
                { href: '/dashboard', label: 'Mi Panel' },
                { href: '/dashboard/inventario', label: 'Mi Inventario' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { href: '/terminos', label: 'Términos de Uso' },
                { href: '/privacidad', label: 'Privacidad' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="mt-8 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Deckcenter. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Precios de referencia:{' '}
            <a
              href="https://www.tcgplayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-4"
            >
              TCGPlayer
            </a>{' '}
            ·{' '}
            <a
              href="https://pokemontcg.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-4"
            >
              Pokemon TCG API
            </a>
          </p>
        </div>

      </div>
    </footer>
  )
}
