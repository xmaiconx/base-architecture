import { WorkspaceUser } from '@agentics/domain';

export interface IWorkspaceUserRepository {
  addUserToWorkspace(data: WorkspaceUser): Promise<WorkspaceUser>;
  findByWorkspaceId(workspaceId: string): Promise<WorkspaceUser[]>;
  findByUserId(userId: string): Promise<WorkspaceUser[]>;
  findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceUser | null>;
  updateRole(workspaceId: string, userId: string, data: { role: string }): Promise<WorkspaceUser>;
  removeUserFromWorkspace(workspaceId: string, userId: string): Promise<void>;
}
