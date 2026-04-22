import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartProvider } from '@/lib/cart-context'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Deckcenter — Encuentra tu carta ideal',
    template: '%s | Deckcenter',
  },
  description:
    'El marketplace nacional de cartas TCG. Encuentra Pokémon, Yu-Gi-Oh!, y más. Compra directo con vendedores verificados.',
  keywords: ['Pokémon', 'TCG', 'cartas coleccionables', 'marketplace', 'Colombia'],
  openGraph: {
    title: 'Deckcenter — Encuentra tu carta ideal',
    description: 'El marketplace nacional de cartas TCG.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <CartProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
