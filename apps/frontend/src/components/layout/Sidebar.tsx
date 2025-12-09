import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import {
  Home,
  User,
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  onClose?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home }
    ]
  },
  {
    title: 'Configurações',
    items: [
      { label: 'Perfil', href: ROUTES.PROFILE, icon: User },
      { label: 'Workspaces', href: ROUTES.SETTINGS_WORKSPACES, icon: Settings },
    ]
  }
]

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-brand-primary to-accent bg-clip-text text-transparent">
          Agentics
        </h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navigationGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.title && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            {groupIndex < navigationGroups.length - 1 && (
              <Separator className="mt-6" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Agentics v1.0.0
        </p>
      </div>
    </div>
  )
}