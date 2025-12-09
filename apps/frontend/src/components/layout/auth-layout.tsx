import { Outlet } from 'react-router-dom'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 lg:bg-muted">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground">
            {APP_DESCRIPTION}
          </p>
          <div className="mt-8 space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Multi-tenancy nativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Autenticação segura</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Pronto para escalar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}