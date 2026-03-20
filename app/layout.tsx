import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartProvider } from '@/lib/cart-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'TCGMarket — Cartas Coleccionables',
    template: '%s | TCGMarket',
  },
  description:
    'El marketplace nacional de cartas TCG. Encuentra Pokémon, Yu-Gi-Oh!, y más. Compra directo con vendedores verificados.',
  keywords: ['Pokémon', 'TCG', 'cartas coleccionables', 'marketplace', 'Colombia'],
  openGraph: {
    title: 'TCGMarket — Cartas Coleccionables',
    description: 'El marketplace nacional de cartas TCG.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col`} suppressHydrationWarning>
        <CartProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
