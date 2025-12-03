import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Workspace } from '@/types/domain/entities'

export interface User {
  id: string
  email: string
  name: string
  accountId: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  currentWorkspace: Workspace | null
  workspaceList: Workspace[]
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setCurrentWorkspace: (workspace: Workspace) => void
  setWorkspaceList: (workspaces: Workspace[]) => void
  addWorkspace: (workspace: Workspace) => void
  updateWorkspace: (id: string, workspace: Workspace) => void
  removeWorkspace: (id: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentWorkspace: null,
      workspaceList: [],
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentWorkspace: null,
          workspaceList: [],
        }),
      setCurrentWorkspace: (workspace) =>
        set({
          currentWorkspace: workspace,
        }),
      setWorkspaceList: (workspaces) =>
        set({
          workspaceList: workspaces,
        }),
      addWorkspace: (workspace) =>
        set((state) => ({
          workspaceList: [...state.workspaceList, workspace],
        })),
      updateWorkspace: (id, workspace) =>
        set((state) => ({
          workspaceList: state.workspaceList.map((w) => (w.id === id ? workspace : w)),
          currentWorkspace: state.currentWorkspace?.id === id ? workspace : state.currentWorkspace,
        })),
      removeWorkspace: (id) =>
        set((state) => ({
          workspaceList: state.workspaceList.filter((w) => w.id !== id),
          currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        })),
    }),
    {
      name: 'fnd-easyflow-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentWorkspace: state.currentWorkspace,
        workspaceList: state.workspaceList,
      }),
    }
  )
)