import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Workspace } from '@agentics/domain';
import { Database } from '../types';
import { IWorkspaceRepository } from '../interfaces';

@Injectable()
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private db: Kysely<Database>) {}

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const now = new Date();
    const result = await this.db
      .insertInto('workspaces')
      .values({
        account_id: dto.accountId,
        name: dto.name,
        settings: dto.settings || null,
        status: 'active',
        onboarding_status: 'pending',
        archived_at: null,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Workspace | null> {
    const result = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return result ? this.mapToEntity(result) : null;
  }

  async findByAccountId(accountId: string): Promise<Workspace[]> {
    const results = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', accountId)
      .where('status', '!=', 'deleted')
      .orderBy('created_at', 'desc')
      .execute();

    return results.map(this.mapToEntity);
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.settings !== undefined) updateData.settings = dto.settings;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.onboardingStatus !== undefined) updateData.onboarding_status = dto.onboardingStatus;

    const result = await this.db
      .updateTable('workspaces')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async archive(id: string, reason?: string): Promise<Workspace> {
    const updateData: any = {
      status: 'archived',
      archived_at: new Date(),
      updated_at: new Date(),
    };

    // Optionally store reason in settings
    if (reason) {
      const workspace = await this.findById(id);
      if (workspace) {
        const settings = workspace.settings || {};
        updateData.settings = { ...settings, archiveReason: reason };
      }
    }

    const result = await this.db
      .updateTable('workspaces')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async restore(id: string): Promise<Workspace> {
    const result = await this.db
      .updateTable('workspaces')
      .set({
        status: 'active',
        archived_at: null,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .updateTable('workspaces')
      .set({ status: 'deleted', updated_at: new Date() })
      .where('id', '=', id)
      .execute();
  }

  private mapToEntity(row: any): Workspace {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      settings: row.settings,
      status: row.status,
      onboardingStatus: row.onboarding_status,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
