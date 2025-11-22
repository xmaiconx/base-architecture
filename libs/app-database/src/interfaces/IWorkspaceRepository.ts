import { Workspace } from '@agentics/domain';

export interface IWorkspaceRepository {
  create(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'archivedAt'>): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  findByAccountId(accountId: string): Promise<Workspace[]>;
  update(id: string, data: Partial<Workspace>): Promise<Workspace>;
  archive(id: string, reason?: string): Promise<Workspace>;
  restore(id: string): Promise<Workspace>;
  delete(id: string): Promise<void>;
}
