import { Project, ProjectSettings, ProjectStatus } from '@fnd/domain';

/**
 * Project Repository Interface
 *
 * Manages bot/agent project configurations with pipeline settings.
 */

/**
 * DTO para criar um projeto (omitindo campos gerados)
 */
export interface CreateProjectData {
  accountId: string;
  workspaceId?: string | null;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  projectType?: string | null;
  pipelineName?: string | null;
  settings?: ProjectSettings | null;
}

/**
 * DTO para atualizar um projeto
 */
export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  projectType?: string | null;
  pipelineName?: string | null;
  settings?: ProjectSettings | null;
  lastUsedAt?: Date | null;
}

/**
 * Filtros para buscar projetos
 */
export interface ProjectFilters {
  accountId?: string;
  workspaceId?: string;
  status?: ProjectStatus;
  projectType?: string;
  search?: string; // Busca por nome ou descrição
}

/**
 * Repository interface para Project
 */
export interface IProjectRepository {
  /**
   * Cria um novo projeto
   */
  create(data: CreateProjectData): Promise<Project>;

  /**
   * Busca um projeto por ID
   */
  findById(id: string, accountId: string): Promise<Project | null>;

  /**
   * Busca projetos por account_id
   */
  findByAccountId(accountId: string, status?: ProjectStatus): Promise<Project[]>;

  /**
   * Busca projetos por workspace_id
   */
  findByWorkspaceId(workspaceId: string, accountId: string): Promise<Project[]>;

  /**
   * Busca projetos por project_type
   */
  findByProjectType(projectType: string, accountId: string): Promise<Project[]>;

  /**
   * Atualiza um projeto
   */
  update(id: string, accountId: string, data: UpdateProjectData): Promise<Project>;

  /**
   * Atualiza apenas o status de um projeto
   */
  updateStatus(id: string, accountId: string, status: ProjectStatus): Promise<Project>;

  /**
   * Atualiza o timestamp de último uso
   */
  updateLastUsedAt(id: string, timestamp: Date): Promise<Project>;

  /**
   * Busca projetos por múltiplos filtros
   */
  findByFilters(filters: ProjectFilters): Promise<Project[]>;

  /**
   * Conta projetos de uma account
   */
  countByAccountId(accountId: string, status?: ProjectStatus): Promise<number>;

  /**
   * Deleta um projeto (hard delete - cascades to threads and messages)
   */
  delete(id: string, accountId: string): Promise<void>;
}
