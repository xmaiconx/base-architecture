export const APP_NAME = 'FND EasyFlow'
export const APP_DESCRIPTION = 'Template base para alunos FND construírem SaaS com IA'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  CONFIRM_EMAIL: '/confirm-email',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS_WORKSPACES: '/settings/workspaces',
  SETTINGS_WORKSPACE: (id: string) => `/settings/workspace/${id}`,
  ONBOARDING: '/onboarding',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    CONFIRM_EMAIL: '/auth/confirm-email',
    ME: '/auth/me',
  },
  WORKSPACES: '/workspaces',
} as const

export const STORAGE_KEYS = {
  AUTH: 'fnd-easyflow-auth',
  THEME: 'fnd-easyflow-theme',
} as const

export const QUERY_KEYS = {
  AUTH: ['auth'],
  ME: ['auth', 'me'],
  WORKSPACES: ['workspaces'],
  WORKSPACE: (id: string) => ['workspaces', id],
  ONBOARDING: (workspaceId: string) => ['onboarding', workspaceId],
  CONTENT: (workspaceId: string) => ['content', workspaceId],
  CALENDAR: (workspaceId: string) => ['calendar', workspaceId],
} as const