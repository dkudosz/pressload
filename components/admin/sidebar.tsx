'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  File,
  Image,
  Users,
  Puzzle,
  Palette,
  Settings,
  LogOut,
  MessageSquare,
  UserCircle,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/pages', label: 'Pages', icon: File },
  { href: '/media', label: 'Media', icon: Image },
  { href: '/comments', label: 'Comments', icon: MessageSquare },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/plugins', label: 'Plugins', icon: Puzzle },
  { href: '/themes', label: 'Themes', icon: Palette },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/profile', label: 'Profile', icon: UserCircle },
]

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'A'

  return (
    <aside className="w-60 flex-shrink-0 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link href="/dashboard" className="font-bold text-lg text-foreground hover:text-primary transition-colors">
          Pressload
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator />

      {/* User footer */}
      <div className="p-3 flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{user.name ?? 'Admin'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ callbackUrl: '/signin' })}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}
