import { useAuth } from '@/contexts/auth-context'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">
          This is your dashboard.
        </p>
      </div>
    </div>
  )
}