import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { WorkspaceFeatureGuard } from '../../guards/workspace-feature.guard';
import { WorkspaceService } from './workspace.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddUserToWorkspaceDto,
  UpdateWorkspaceUserRoleDto,
} from './dtos';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, WorkspaceFeatureGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(@Body() dto: CreateWorkspaceDto, @Request() req: any) {
    return await this.workspaceService.createWorkspace(dto, req.user.userId);
  }

  @Get()
  async findByAccount(@Request() req: any) {
    return await this.workspaceService.findByAccountId(req.user.accountId);
  }

  @Get('my')
  async findMyWorkspaces(@Request() req: any) {
    return await this.workspaceService.findWorkspacesByUser(req.user.userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.workspaceService.findById(id);
  }

  @Patch(':id')
  async updateWorkspace(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    return await this.workspaceService.updateWorkspace(id, dto);
  }

  @Patch(':id/archive')
  async archiveWorkspace(@Param('id') id: string, @Body() body: { reason?: string }) {
    return await this.workspaceService.archiveWorkspace(id, body.reason);
  }

  @Patch(':id/restore')
  async restoreWorkspace(@Param('id') id: string) {
    return await this.workspaceService.restoreWorkspace(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWorkspace(@Param('id') id: string) {
    await this.workspaceService.deleteWorkspace(id);
  }

  @Post(':id/users')
  @HttpCode(HttpStatus.CREATED)
  async addUserToWorkspace(
    @Param('id') workspaceId: string,
    @Body() dto: Omit<AddUserToWorkspaceDto, 'workspaceId'>,
    @Request() req: any,
  ) {
    const fullDto: AddUserToWorkspaceDto = {
      workspaceId,
      ...dto,
    };
    return await this.workspaceService.addUserToWorkspace(fullDto, req.user.userId);
  }

  @Get(':id/users')
  async findUsersByWorkspace(@Param('id') workspaceId: string) {
    return await this.workspaceService.findUsersByWorkspace(workspaceId);
  }

  @Patch(':id/users/:userId/role')
  async updateUserRole(
    @Param('id') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceUserRoleDto,
  ) {
    return await this.workspaceService.updateUserRole(workspaceId, userId, dto);
  }

  @Delete(':id/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUserFromWorkspace(@Param('id') workspaceId: string, @Param('userId') userId: string) {
    await this.workspaceService.removeUserFromWorkspace(workspaceId, userId);
  }
}
