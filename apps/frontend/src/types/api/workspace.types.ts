/**
 * Workspace Module DTOs - Frontend Types
 * Mirrored from backend workspace module
 */

export interface CreateWorkspaceDto {
  accountId: string;
  name: string;
  settings?: object;
}

export interface UpdateWorkspaceDto {
  name?: string;
  settings?: object;
  status?: 'active' | 'inactive' | 'suspended';
  onboardingStatus?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
}

export interface WorkspaceResponseDto {
  id: string;
  accountId: string;
  name: string;
  settings?: object;
  status: 'active' | 'inactive' | 'suspended';
  onboardingStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddUserToWorkspaceDto {
  workspaceId: string;
  userId: string;
  role: string; // 'owner' | 'admin' | 'member' | 'viewer'
}

export interface UpdateWorkspaceUserRoleDto {
  role: string;
}

export interface WorkspaceUserResponseDto {
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: Date;
  // Enriched data
  userFullName?: string;
  userEmail?: string;
}
