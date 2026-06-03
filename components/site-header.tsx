import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

export function SiteHeader() {
  return (
    <header className="border-b border-border/40 backdrop-blur-sm">
      <nav className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-foreground hover:text-primary transition-colors">
          {siteConfig.name}
        </Link>
        <ul className="flex items-center gap-6 list-none m-0 p-0">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
