import type {
  IEmailService,
  ILoggerService,
  IConfigurationService,
} from '@fnd/backend';
import type {
  IAuditLogRepository,
  IWebhookEventRepository,
  IUserRepository,
  IAccountRepository,
  IWorkspaceRepository,
} from '@fnd/database';

/**
 * Handler context with injected dependencies.
 * Pure handlers receive this context instead of using NestJS DI.
 * Factory creates this context with direct service instantiation.
 */
export interface HandlerContext {
  emailService: IEmailService;
  auditLogRepository: IAuditLogRepository;
  webhookEventRepository: IWebhookEventRepository;
  userRepository: IUserRepository;
  accountRepository: IAccountRepository;
  workspaceRepository: IWorkspaceRepository;
  config: IConfigurationService;
  logger: ILoggerService;
}
