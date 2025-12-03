import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Project, ProjectStatus } from '@fnd/domain';
import { Database } from '../types';
import {
  IProjectRepository,
  CreateProjectData,
  UpdateProjectData,
  ProjectFilters,
} from '../interfaces/IProjectRepository';

@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private db: Kysely<Database>) {}

  async create(data: CreateProjectData): Promise<Project> {
    const now = new Date();
    const result = await this.db
      .insertInto('projects')
      .values({
        account_id: data.accountId,
        workspace_id: data.workspaceId ?? null,
        name: data.name,
        description: data.description ?? null,
        status: data.status ?? ProjectStatus.ACTIVE,
        project_type: data.projectType ?? null,
        pipeline_name: data.pipelineName ?? null,
        settings: data.settings ? JSON.stringify(data.settings) : null,
        created_at: now,
        updated_at: now,
        last_used_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToProject(result);
  }

  async findById(id: string, accountId: string): Promise<Project | null> {
    const result = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    return result ? this.mapToProject(result) : null;
  }

  async findByAccountId(accountId: string, status?: ProjectStatus): Promise<Project[]> {
    let query = this.db
      .selectFrom('projects')
      .selectAll()
      .where('account_id', '=', accountId);

    if (status) {
      query = query.where('status', '=', status);
    }

    const results = await query
      .orderBy('last_used_at', 'desc')
      .orderBy('created_at', 'desc')
      .execute();

    return results.map((row) => this.mapToProject(row));
  }

  async findByWorkspaceId(workspaceId: string, accountId: string): Promise<Project[]> {
    const results = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('account_id', '=', accountId)
      .orderBy('last_used_at', 'desc')
      .orderBy('created_at', 'desc')
      .execute();

    return results.map((row) => this.mapToProject(row));
  }

  async findByProjectType(projectType: string, accountId: string): Promise<Project[]> {
    const results = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('project_type', '=', projectType)
      .where('account_id', '=', accountId)
      .orderBy('last_used_at', 'desc')
      .orderBy('created_at', 'desc')
      .execute();

    return results.map((row) => this.mapToProject(row));
  }

  async update(
    id: string,
    accountId: string,
    data: UpdateProjectData,
  ): Promise<Project> {
    const now = new Date();
    const result = await this.db
      .updateTable('projects')
      .set({
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        status: data.status ?? undefined,
        project_type: data.projectType ?? undefined,
        pipeline_name: data.pipelineName ?? undefined,
        settings: data.settings ? JSON.stringify(data.settings) : undefined,
        last_used_at: data.lastUsedAt ?? undefined,
        updated_at: now,
      })
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToProject(result);
  }

  async updateStatus(
    id: string,
    accountId: string,
    status: ProjectStatus,
  ): Promise<Project> {
    const result = await this.db
      .updateTable('projects')
      .set({
        status,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToProject(result);
  }

  async updateLastUsedAt(id: string, timestamp: Date): Promise<Project> {
    const result = await this.db
      .updateTable('projects')
      .set({
        last_used_at: timestamp,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToProject(result);
  }

  async findByFilters(filters: ProjectFilters): Promise<Project[]> {
    let query = this.db.selectFrom('projects').selectAll();

    if (filters.accountId) {
      query = query.where('account_id', '=', filters.accountId);
    }
    if (filters.workspaceId) {
      query = query.where('workspace_id', '=', filters.workspaceId);
    }
    if (filters.status) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.projectType) {
      query = query.where('project_type', '=', filters.projectType);
    }
    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('description', 'ilike', `%${filters.search}%`),
        ]),
      );
    }

    const results = await query
      .orderBy('last_used_at', 'desc')
      .orderBy('created_at', 'desc')
      .execute();

    return results.map((row) => this.mapToProject(row));
  }

  async countByAccountId(accountId: string, status?: ProjectStatus): Promise<number> {
    let query = this.db
      .selectFrom('projects')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('account_id', '=', accountId);

    if (status) {
      query = query.where('status', '=', status);
    }

    const result = await query.executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async delete(id: string, accountId: string): Promise<void> {
    await this.db
      .deleteFrom('projects')
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .execute();
  }

  /**
   * Maps database row to Project entity (snake_case → camelCase)
   */
  private mapToProject(row: any): Project {
    return {
      id: row.id,
      accountId: row.account_id,
      workspaceId: row.workspace_id,
      name: row.name,
      description: row.description,
      status: row.status as ProjectStatus,
      projectType: row.project_type,
      pipelineName: row.pipeline_name,
      settings: row.settings ? JSON.parse(row.settings) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastUsedAt: row.last_used_at,
    };
  }
}
