'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Home, Scale, Wallet } from 'lucide-react'

import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
  {
    href: '/policies',
    label: 'Policies',
    icon: FileText,
    match: (path: string) => path.startsWith('/policies'),
  },
  {
    href: '/claims',
    label: 'Claims',
    icon: Scale,
    match: (path: string) => path.startsWith('/claims'),
  },
  {
    href: '/settings',
    label: 'Wallet',
    icon: Wallet,
    match: (path: string) => path.startsWith('/settings'),
  },
] as const

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium min-h-[48px] transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
