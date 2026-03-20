import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { LayoutDashboard, Package, User, LogOut, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/inventario', label: 'Mi Inventario', icon: Package },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: User },
  { href: '/tiendas', label: 'Tiendas Aliadas', icon: Store },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, store_name, user_type')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto">

      {/* Sidebar — solo desktop */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border/40 bg-card/30 px-3 py-6 flex-shrink-0">

        {/* Info del vendedor */}
        <div className="mb-6 px-2">
          <p className="text-xs text-muted-foreground">Panel de</p>
          <p className="font-semibold truncate">{profile?.store_name ?? profile?.full_name ?? 'Mi Tienda'}</p>
          <span className="text-[11px] text-yellow-400">
            {{ seller: 'Vendedor', buyer: 'Comprador', both: 'Vendo y compro' }[profile?.user_type ?? 'seller'] ?? 'Vendedor'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <form>
          <Button
            formAction={logout}
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground px-3"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        {/* Bottom nav — solo móvil */}
        <nav className="md:hidden flex border-t border-border/40 bg-background sticky bottom-0">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(' ')[0]}
            </Link>
          ))}
        </nav>
      </div>

    </div>
  )
}
