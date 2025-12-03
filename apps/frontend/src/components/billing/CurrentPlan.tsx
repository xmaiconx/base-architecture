import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BillingInfoResponseDto } from '@/types/api/billing'

interface CurrentPlanProps {
  billingInfo: BillingInfoResponseDto
  onManageSubscription: () => void
  isLoading?: boolean
}

export function CurrentPlan({ billingInfo, onManageSubscription, isLoading }: CurrentPlanProps) {
  const { plan, subscription, usage } = billingInfo

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const getSubscriptionStatusBadge = () => {
    if (!subscription) {
      return <Badge variant="secondary">Gratuito</Badge>
    }

    switch (subscription.status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'past_due':
        return <Badge variant="destructive">Pagamento Pendente</Badge>
      default:
        return <Badge variant="secondary">{subscription.status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plano Atual</CardTitle>
            <CardDescription>Informações sobre sua assinatura</CardDescription>
          </div>
          {getSubscriptionStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Details */}
        <div>
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          {subscription && (
            <p className="text-sm text-muted-foreground mt-1">
              Renova em {formatDate(subscription.currentPeriodEnd)}
            </p>
          )}
          {subscription?.cancelAtPeriodEnd && (
            <p className="text-sm text-destructive mt-1">
              ⚠️ Sua assinatura será cancelada em {formatDate(subscription.currentPeriodEnd)}
            </p>
          )}
        </div>

        {/* Usage Limits */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Uso Atual</h4>

          <div className="space-y-2">
            {/* Workspaces */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workspaces</span>
              <span className="font-medium">
                {usage.workspacesUsed} / {usage.workspacesLimit === -1 ? '∞' : usage.workspacesLimit}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: usage.workspacesLimit === -1
                    ? '0%'
                    : `${Math.min((usage.workspacesUsed / usage.workspacesLimit) * 100, 100)}%`,
                }}
              />
            </div>

            {/* Users in Workspace */}
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground">Usuários neste workspace</span>
              <span className="font-medium">
                {usage.usersInWorkspace} / {usage.usersLimit === -1 ? '∞' : usage.usersLimit}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: usage.usersLimit === -1
                    ? '0%'
                    : `${Math.min((usage.usersInWorkspace / usage.usersLimit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Manage Subscription Button (only if has subscription) */}
        {subscription && (
          <Button
            variant="outline"
            onClick={onManageSubscription}
            disabled={isLoading}
            className="w-full"
          >
            Gerenciar Assinatura
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
