import { useState } from 'react'
import { ChevronDown, Plus, Search } from 'lucide-react'
import type { Workspace } from '@/types/domain/entities'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/use-workspace'
import { CreateWorkspaceModal } from './create-workspace-modal'

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { workspaces, currentWorkspace, switchWorkspace, isLoadingWorkspaces } = useWorkspace()

  // Helper to get avatar initial from workspace name
  const getWorkspaceInitial = (name: string) => name.charAt(0).toUpperCase()

  // Filter active workspaces only (exclude archived/deleted)
  const activeWorkspaces = workspaces.filter((w) => w.status === 'active')
  const recentWorkspaces = activeWorkspaces.filter((w) => w.id !== currentWorkspace?.id).slice(0, 2)

  const filteredWorkspaces = activeWorkspaces.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectWorkspace = (workspace: Workspace) => {
    setOpen(false)
    switchWorkspace(workspace)
  }

  const handleCreateWorkspace = () => {
    setOpen(false)
    setCreateModalOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2 md:px-3 hover:bg-muted/50"
          disabled={isLoadingWorkspaces}
        >
          <Avatar className="h-7 w-7 md:h-8 md:w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {currentWorkspace ? getWorkspaceInitial(currentWorkspace.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block font-medium text-sm max-w-[150px] truncate">
            {currentWorkspace?.name || 'Selecionar Workspace'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Workspaces</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar workspaces..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="max-h-[400px] overflow-y-auto">
          {/* Current Workspace */}
          {!searchQuery && currentWorkspace && (
            <>
              <div className="px-6 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Workspace Atual</p>
                <WorkspaceItem
                  workspace={currentWorkspace}
                  isActive
                  onClick={() => handleSelectWorkspace(currentWorkspace)}
                  getInitial={getWorkspaceInitial}
                />
              </div>
              <Separator />
            </>
          )}

          {/* Recent Workspaces */}
          {!searchQuery && recentWorkspaces.length > 0 && (
            <>
              <div className="px-6 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recentes</p>
                <div className="space-y-1">
                  {recentWorkspaces.map(workspace => (
                    <WorkspaceItem
                      key={workspace.id}
                      workspace={workspace}
                      onClick={() => handleSelectWorkspace(workspace)}
                      getInitial={getWorkspaceInitial}
                    />
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="px-6 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Resultados ({filteredWorkspaces.length})
              </p>
              <div className="space-y-1">
                {filteredWorkspaces.length > 0 ? (
                  filteredWorkspaces.map(workspace => (
                    <WorkspaceItem
                      key={workspace.id}
                      workspace={workspace}
                      isActive={workspace.id === currentWorkspace?.id}
                      onClick={() => handleSelectWorkspace(workspace)}
                      getInitial={getWorkspaceInitial}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum workspace encontrado
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Create New Workspace */}
        <div className="px-6 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleCreateWorkspace}
          >
            <Plus className="h-4 w-4" />
            Criar Novo Workspace
          </Button>
        </div>
      </DialogContent>

      <CreateWorkspaceModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </Dialog>
  )
}

interface WorkspaceItemProps {
  workspace: Workspace
  isActive?: boolean
  onClick: () => void
  getInitial: (name: string) => string
}

function WorkspaceItem({ workspace, isActive, onClick, getInitial }: WorkspaceItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        "hover:bg-muted/50 active:bg-muted",
        isActive && "bg-muted"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className={cn(
          "text-sm font-medium",
          isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {getInitial(workspace.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 text-left">
        <p className={cn(
          "text-sm font-medium",
          isActive && "text-foreground"
        )}>
          {workspace.name}
        </p>
      </div>
      {isActive && (
        <div className="h-2 w-2 rounded-full bg-primary" />
      )}
    </button>
  )
}
