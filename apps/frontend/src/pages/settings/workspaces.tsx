import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Settings, Archive, Loader2, RotateCcw } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'
import { CreateWorkspaceModal } from '@/components/workspace'
import type { Workspace } from '@/types/domain/entities'
import { ROUTES } from '@/lib/constants'

export function WorkspacesPage() {
  const navigate = useNavigate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { workspaces, isLoadingWorkspaces, switchWorkspace } = useWorkspace()

  const activeWorkspaces = workspaces.filter((w: Workspace) => w.status === 'active')
  const archivedWorkspaces = workspaces.filter((w: Workspace) => w.status === 'archived')

  const getWorkspaceInitial = (name: string) => name.charAt(0).toUpperCase()

  if (isLoadingWorkspaces) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground mt-1">Manage your workspaces</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* Tabs for Active / Archived */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Active ({activeWorkspaces.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedWorkspaces.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeWorkspaces.length > 0 ? (
            activeWorkspaces.map((workspace: Workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                getInitial={getWorkspaceInitial}
                onSwitch={() => switchWorkspace(workspace)}
                onSettings={() => navigate(typeof ROUTES.SETTINGS_WORKSPACE === 'function' ? ROUTES.SETTINGS_WORKSPACE(workspace.id) : `/settings/workspace/${workspace.id}`)}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active workspaces found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4 mt-6">
          {archivedWorkspaces.length > 0 ? (
            archivedWorkspaces.map((workspace: Workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                getInitial={getWorkspaceInitial}
                onSettings={() => navigate(typeof ROUTES.SETTINGS_WORKSPACE === 'function' ? ROUTES.SETTINGS_WORKSPACE(workspace.id) : `/settings/workspace/${workspace.id}`)}
                isArchived
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No archived workspaces found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              💡
            </div>
            <div>
              <h4 className="font-medium mb-1">About Workspaces</h4>
              <p className="text-sm text-muted-foreground">
                Each workspace represents a different project or client with its own settings and content. Ideal for
                managing multiple clients or brands.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateWorkspaceModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  )
}

interface WorkspaceCardProps {
  workspace: Workspace
  getInitial: (name: string) => string
  onSwitch?: () => void
  onSettings: () => void
  isArchived?: boolean
}

function WorkspaceCard({ workspace, getInitial, onSwitch, onSettings, isArchived }: WorkspaceCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitial(workspace.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-2">
                {workspace.name}
                {isArchived && <Archive className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created on {new Date(workspace.createdAt).toLocaleDateString()} • Status:{' '}
                {workspace.onboardingStatus === 'completed' ? 'Complete' : 'Pending'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isArchived && onSwitch && (
              <Button variant="outline" size="sm" onClick={onSwitch}>
                Open
              </Button>
            )}
            {isArchived && (
              <Button variant="outline" size="sm" onClick={onSettings}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
