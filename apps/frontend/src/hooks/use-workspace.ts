import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '@/types'
import { api } from '@/lib/api'
import { QUERY_KEYS, ROUTES, API_ENDPOINTS } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Hook for workspace management with TanStack Query
 * Integrates with AuthStore for state management
 */
export function useWorkspace() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const {
    user,
    currentWorkspace,
    workspaceList,
    setCurrentWorkspace,
    setWorkspaceList,
    addWorkspace,
    updateWorkspace: updateWorkspaceInStore,
    removeWorkspace: removeWorkspaceFromStore,
  } = useAuthStore()

  // Query: Get all workspaces for current account
  const workspacesQuery = useQuery({
    queryKey: QUERY_KEYS.WORKSPACES,
    queryFn: async () => {
      const response = await api.get<Workspace[]>(API_ENDPOINTS.WORKSPACES)
      setWorkspaceList(response.data)

      // Set first workspace as current if none selected
      if (!currentWorkspace && response.data.length > 0) {
        const activeWorkspace = response.data.find((w) => w.status === 'active')
        if (activeWorkspace) {
          setCurrentWorkspace(activeWorkspace)
        }
      }

      return response.data
    },
    enabled: !!user?.accountId,
  })

  // Query: Get single workspace by ID
  const useWorkspaceById = (workspaceId: string | undefined) => {
    return useQuery({
      queryKey: workspaceId ? QUERY_KEYS.WORKSPACE(workspaceId) : ['workspace-disabled'],
      queryFn: async () => {
        const response = await api.get<Workspace>(`${API_ENDPOINTS.WORKSPACES}/${workspaceId}`)
        return response.data
      },
      enabled: !!workspaceId,
    })
  }

  // Mutation: Create new workspace
  const createWorkspaceMutation = useMutation({
    mutationFn: async (dto: CreateWorkspaceDto) => {
      const response = await api.post<Workspace>(API_ENDPOINTS.WORKSPACES, dto)
      return response.data
    },
    onSuccess: (newWorkspace) => {
      addWorkspace(newWorkspace)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES })
    },
  })

  // Mutation: Update workspace
  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkspaceDto }) => {
      const response = await api.patch<Workspace>(`${API_ENDPOINTS.WORKSPACES}/${id}`, data)
      return response.data
    },
    onSuccess: (updatedWorkspace) => {
      updateWorkspaceInStore(updatedWorkspace.id, updatedWorkspace)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE(updatedWorkspace.id) })
    },
  })

  // Mutation: Archive workspace
  const archiveWorkspaceMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await api.patch<Workspace>(
        `${API_ENDPOINTS.WORKSPACES}/${id}/archive`,
        { reason }
      )
      return response.data
    },
    onSuccess: (archivedWorkspace) => {
      updateWorkspaceInStore(archivedWorkspace.id, archivedWorkspace)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES })
    },
  })

  // Mutation: Restore workspace
  const restoreWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Workspace>(`${API_ENDPOINTS.WORKSPACES}/${id}/restore`)
      return response.data
    },
    onSuccess: (restoredWorkspace) => {
      updateWorkspaceInStore(restoredWorkspace.id, restoredWorkspace)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES })
    },
  })

  // Mutation: Delete workspace (schedules for deletion in 30 days)
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${API_ENDPOINTS.WORKSPACES}/${id}`)
    },
    onSuccess: (_, deletedId) => {
      removeWorkspaceFromStore(deletedId)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES })

      // If deleted workspace was current, switch to first available
      if (currentWorkspace?.id === deletedId && workspaceList.length > 1) {
        const firstAvailable = workspaceList.find((w) => w.id !== deletedId)
        if (firstAvailable) {
          switchWorkspace(firstAvailable)
        }
      }
    },
  })

  /**
   * Switch to a different workspace
   * Context switching logic - invalidates queries, redirects based on onboarding status
   */
  const switchWorkspace = (workspace: Workspace) => {
    // Update current workspace in store
    setCurrentWorkspace(workspace)

    // Invalidate all workspace-scoped queries
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ONBOARDING(workspace.id) })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTENT(workspace.id) })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR(workspace.id) })

    // Redirect based on onboarding status
    if (workspace.onboardingStatus !== 'completed') {
      navigate(ROUTES.ONBOARDING)
    } else {
      navigate(ROUTES.DASHBOARD)
    }
  }

  return {
    // Queries
    workspaces: workspacesQuery.data || workspaceList,
    isLoadingWorkspaces: workspacesQuery.isLoading,
    currentWorkspace,
    useWorkspaceById,

    // Mutations
    createWorkspace: createWorkspaceMutation.mutate,
    isCreatingWorkspace: createWorkspaceMutation.isPending,

    updateWorkspace: updateWorkspaceMutation.mutate,
    isUpdatingWorkspace: updateWorkspaceMutation.isPending,

    archiveWorkspace: archiveWorkspaceMutation.mutate,
    isArchivingWorkspace: archiveWorkspaceMutation.isPending,

    restoreWorkspace: restoreWorkspaceMutation.mutate,
    isRestoringWorkspace: restoreWorkspaceMutation.isPending,

    deleteWorkspace: deleteWorkspaceMutation.mutate,
    isDeletingWorkspace: deleteWorkspaceMutation.isPending,

    // Context switching
    switchWorkspace,
  }
}
