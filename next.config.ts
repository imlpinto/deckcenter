import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        // TCGdex CDN — imágenes de cartas
        protocol: 'https',
        hostname: 'assets.tcgdex.net',
      },
      {
        // Supabase Storage — fotos subidas por vendedores
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
