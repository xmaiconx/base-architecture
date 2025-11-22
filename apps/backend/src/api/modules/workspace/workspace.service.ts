import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Workspace, WorkspaceUser } from '@agentics/domain';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddUserToWorkspaceDto,
  UpdateWorkspaceUserRoleDto,
} from './dtos';
import { WorkspaceCreatedEvent, UserAddedToWorkspaceEvent } from './events';
import { IWorkspaceRepository, IWorkspaceUserRepository } from '@agentics/database';
import { ILoggerService } from '@agentics/backend';

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject('IWorkspaceRepository') private readonly workspaceRepository: IWorkspaceRepository,
    @Inject('IWorkspaceUserRepository') private readonly workspaceUserRepository: IWorkspaceUserRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    private readonly eventBus: EventBus,
  ) {}

  async createWorkspace(dto: CreateWorkspaceDto, createdBy: string): Promise<Workspace> {
    this.logger.info('Creating workspace', {
      operation: 'workspace.create.start',
      module: 'WorkspaceService',
      accountId: dto.accountId,
      name: dto.name,
    });

    const workspace = await this.workspaceRepository.create(dto);

    // Add creator as owner
    await this.workspaceUserRepository.addUserToWorkspace({
      workspaceId: workspace.id,
      userId: createdBy,
      role: 'owner',
    });

    // Publish event
    const event = new WorkspaceCreatedEvent(workspace.id, {
      workspaceId: workspace.id,
      accountId: workspace.accountId,
      name: workspace.name,
      createdBy,
    });
    this.eventBus.publish(event);

    this.logger.info('Workspace created successfully', {
      operation: 'workspace.create.success',
      module: 'WorkspaceService',
      workspaceId: workspace.id,
      accountId: dto.accountId,
    });

    return workspace;
  }

  async findById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async findByAccountId(accountId: string): Promise<Workspace[]> {
    return await this.workspaceRepository.findByAccountId(accountId);
  }

  async updateWorkspace(id: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    this.logger.info('Updating workspace', {
      operation: 'workspace.update.start',
      module: 'WorkspaceService',
      workspaceId: id,
    });

    const workspace = await this.workspaceRepository.update(id, dto);

    this.logger.info('Workspace updated successfully', {
      operation: 'workspace.update.success',
      module: 'WorkspaceService',
      workspaceId: id,
    });

    return workspace;
  }

  async archiveWorkspace(id: string, reason?: string): Promise<Workspace> {
    this.logger.info('Archiving workspace', {
      operation: 'workspace.archive.start',
      module: 'WorkspaceService',
      workspaceId: id,
      reason,
    });

    const workspace = await this.workspaceRepository.archive(id, reason);

    this.logger.info('Workspace archived successfully', {
      operation: 'workspace.archive.success',
      module: 'WorkspaceService',
      workspaceId: id,
    });

    return workspace;
  }

  async restoreWorkspace(id: string): Promise<Workspace> {
    this.logger.info('Restoring workspace', {
      operation: 'workspace.restore.start',
      module: 'WorkspaceService',
      workspaceId: id,
    });

    const workspace = await this.workspaceRepository.restore(id);

    this.logger.info('Workspace restored successfully', {
      operation: 'workspace.restore.success',
      module: 'WorkspaceService',
      workspaceId: id,
    });

    return workspace;
  }

  async deleteWorkspace(id: string): Promise<void> {
    this.logger.info('Deleting workspace', {
      operation: 'workspace.delete.start',
      module: 'WorkspaceService',
      workspaceId: id,
    });

    await this.workspaceRepository.delete(id);

    this.logger.info('Workspace deleted successfully', {
      operation: 'workspace.delete.success',
      module: 'WorkspaceService',
      workspaceId: id,
    });
  }

  async addUserToWorkspace(dto: AddUserToWorkspaceDto, addedBy: string): Promise<WorkspaceUser> {
    this.logger.info('Adding user to workspace', {
      operation: 'workspace.add_user.start',
      module: 'WorkspaceService',
      workspaceId: dto.workspaceId,
      userId: dto.userId,
      role: dto.role,
    });

    const workspaceUser = await this.workspaceUserRepository.addUserToWorkspace(dto);

    // Publish event
    const event = new UserAddedToWorkspaceEvent(dto.workspaceId, {
      workspaceId: dto.workspaceId,
      userId: dto.userId,
      role: dto.role,
      addedBy,
    });
    this.eventBus.publish(event);

    this.logger.info('User added to workspace successfully', {
      operation: 'workspace.add_user.success',
      module: 'WorkspaceService',
      workspaceId: dto.workspaceId,
      userId: dto.userId,
    });

    return workspaceUser;
  }

  async findUsersByWorkspace(workspaceId: string): Promise<WorkspaceUser[]> {
    return await this.workspaceUserRepository.findByWorkspaceId(workspaceId);
  }

  async findWorkspacesByUser(userId: string): Promise<WorkspaceUser[]> {
    return await this.workspaceUserRepository.findByUserId(userId);
  }

  async updateUserRole(workspaceId: string, userId: string, dto: UpdateWorkspaceUserRoleDto): Promise<WorkspaceUser> {
    this.logger.info('Updating user role in workspace', {
      operation: 'workspace.update_role.start',
      module: 'WorkspaceService',
      workspaceId,
      userId,
      newRole: dto.role,
    });

    const workspaceUser = await this.workspaceUserRepository.updateRole(workspaceId, userId, dto);

    this.logger.info('User role updated successfully', {
      operation: 'workspace.update_role.success',
      module: 'WorkspaceService',
      workspaceId,
      userId,
    });

    return workspaceUser;
  }

  async removeUserFromWorkspace(workspaceId: string, userId: string): Promise<void> {
    this.logger.info('Removing user from workspace', {
      operation: 'workspace.remove_user.start',
      module: 'WorkspaceService',
      workspaceId,
      userId,
    });

    await this.workspaceUserRepository.removeUserFromWorkspace(workspaceId, userId);

    this.logger.info('User removed from workspace successfully', {
      operation: 'workspace.remove_user.success',
      module: 'WorkspaceService',
      workspaceId,
      userId,
    });
  }

  async validateUserAccess(workspaceId: string, userId: string): Promise<boolean> {
    const workspaceUser = await this.workspaceUserRepository.findByWorkspaceAndUser(workspaceId, userId);
    return workspaceUser !== null;
  }
}
