'use client'

import { useEffect, useState } from 'react'

export function NavbarShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', update, { passive: true })
    update() // estado inicial
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
      scrolled
        ? 'border-border/40 bg-background/80 backdrop-blur-xl'
        : 'border-transparent bg-transparent'
    }`}>
      {children}
    </nav>
  )
}
