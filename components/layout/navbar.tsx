import Link from 'next/link'
import { Menu, User, Zap, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CartSheet } from '@/components/cart/cart-sheet'

const navLinks = [
  { href: '/buscar', label: 'Buscar Cartas' },
  { href: '/vendedores', label: 'Vendedores' },
  { href: '/tiendas', label: 'Tiendas Aliadas' },
]

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = 'Mi cuenta'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, store_name')
      .eq('id', user.id)
      .single()
    displayName = profile?.store_name ?? profile?.full_name ?? 'Mi cuenta'
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400">
            <Zap className="h-5 w-5 text-slate-900" />
          </div>
          <span className="text-lg font-bold text-gold-gradient hidden sm:block">TCGMarket</span>
          <span className="text-lg font-bold text-gold-gradient sm:hidden">TCG</span>
        </Link>

        {/* Nav Links — Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Acciones — Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <CartSheet />
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </Button>
              </Link>
              <form>
                <Button
                  formAction={logout}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Ingresar
                </Button>
              </Link>
              <Link href="/auth/registro">
                <Button size="sm" className="bg-yellow-400 text-slate-900 hover:bg-yellow-300">
                  Vender
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: carrito + menú hamburguesa */}
        <div className="flex items-center gap-1 md:hidden">
          <CartSheet />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background">
              <SheetHeader>
                <SheetTitle className="text-gold-gradient text-left">TCGMarket</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}
                    className="flex items-center rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  {user ? (
                    <>
                      <Link href="/dashboard">
                        <Button variant="outline" className="w-full gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Mi Panel
                        </Button>
                      </Link>
                      <form>
                        <Button
                          formAction={logout}
                          variant="ghost"
                          className="w-full text-muted-foreground hover:text-foreground"
                        >
                          Cerrar sesión
                        </Button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login">
                        <Button variant="outline" className="w-full">
                          <User className="mr-2 h-4 w-4" />
                          Ingresar
                        </Button>
                      </Link>
                      <Link href="/auth/registro">
                        <Button className="w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300">
                          Panel de Vendedor
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  )
}
