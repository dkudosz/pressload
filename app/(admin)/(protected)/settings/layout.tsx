import Link from 'next/link'
import { ReactNode } from 'react'

const SETTINGS_NAV = [
  { href: '/settings', label: 'General', exact: true },
  { href: '/settings/reading', label: 'Reading' },
  { href: '/settings/discussion', label: 'Discussion' },
  { href: '/settings/permalinks', label: 'Permalinks' },
  { href: '/settings/menus', label: 'Menus' },
  { href: '/settings/api', label: 'API & Webhooks' },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>
      <div className="flex gap-8">
        <nav className="w-44 shrink-0">
          <ul className="space-y-1">
            {SETTINGS_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
