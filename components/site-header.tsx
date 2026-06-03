import Link from 'next/link'
import { getMenuByLocation } from '@/lib/actions/menus'
import { getOption } from '@/lib/options'
import { siteConfig } from '@/lib/site-config'

const FALLBACK_NAV = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
]

export async function SiteHeader() {
  const [menu, siteName] = await Promise.all([
    getMenuByLocation('primary'),
    getOption('blogname', siteConfig.name),
  ])

  const navItems =
    menu && menu.items.length > 0
      ? menu.items.map((item) => ({ href: item.url || '/', label: item.label }))
      : FALLBACK_NAV

  return (
    <header className="border-b border-border/40 backdrop-blur-sm">
      <nav className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-foreground hover:text-primary transition-colors">
          {siteName}
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
