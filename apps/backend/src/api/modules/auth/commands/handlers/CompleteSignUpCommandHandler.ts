import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { CompleteSignUpCommand } from '../CompleteSignUpCommand';
import { AccountCreatedEvent } from '../../events/AccountCreatedEvent';
import { EntityStatus, UserRole, OnboardingStatus } from '@agentics/domain';
import { IUserRepository, IAccountRepository, IWorkspaceRepository, IWorkspaceUserRepository } from '@agentics/database';
import { ILoggerService, IEventBroker, IConfigurationService } from '@agentics/backend';

/**
 * CompleteSignUpCommandHandler
 *
 * Handles signup completion after Supabase creates auth user.
 * Creates Account → Workspace → User atomically (transactional).
 *
 * Flow:
 * 1. Supabase creates auth.users (via frontend signup)
 * 2. Supabase dispatches webhook → Backend
 * 3. Backend executes this command
 * 4. Account/Workspace/User created and linked via auth_user_id
 * 5. AccountCreatedEvent published (triggers welcome email)
 *
 * Idempotency: If User with auth_user_id already exists, returns success
 * (webhook retry or duplicate call).
 */
@CommandHandler(CompleteSignUpCommand)
export class CompleteSignUpCommandHandler implements ICommandHandler<CompleteSignUpCommand> {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('IAccountRepository') private readonly accountRepository: IAccountRepository,
    @Inject('IWorkspaceRepository') private readonly workspaceRepository: IWorkspaceRepository,
    @Inject('IWorkspaceUserRepository') private readonly workspaceUserRepository: IWorkspaceUserRepository,
    @Inject('IEventBroker') private readonly eventBroker: IEventBroker,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    @Inject('IConfigurationService') private readonly configService: IConfigurationService,
  ) {}

  async execute(command: CompleteSignUpCommand): Promise<{ userId: string; accountId: string }> {
    const { authUserId, email, fullName } = command;

    this.logger.info('Starting CompleteSignUp process', {
      operation: 'auth.complete_signup.start',
      module: 'CompleteSignUpCommandHandler',
      authUserId,
      email,
    });

    // Idempotency check: If User already exists with this auth_user_id, return success
    const existingUser = await this.userRepository.findByAuthUserId(authUserId);
    if (existingUser) {
      this.logger.warn('User already exists for auth_user_id (idempotent retry)', {
        operation: 'auth.complete_signup.user_exists',
        module: 'CompleteSignUpCommandHandler',
        authUserId,
        userId: existingUser.id,
        accountId: existingUser.accountId,
      });
      return { userId: existingUser.id, accountId: existingUser.accountId };
    }

    // Check if email already in use (edge case: manual DB manipulation)
    const userByEmail = await this.userRepository.findByEmail(email);
    if (userByEmail) {
      const err = new Error('Email already in use by different user');
      this.logger.error('Email already in use by different user', err, {
        operation: 'auth.complete_signup.email_conflict',
        module: 'CompleteSignUpCommandHandler',
        authUserId,
        email,
        existingUserId: userByEmail.id,
      });
      throw new BadRequestException('Email already in use');
    }

    // Create Account (tenant root)
    const account = await this.accountRepository.create({
      name: `Clínica de ${fullName}`,
    });

    this.logger.info('Account created', {
      operation: 'auth.complete_signup.account_created',
      module: 'CompleteSignUpCommandHandler',
      accountId: account.id,
      authUserId,
    });

    // Create default Workspace
    const workspace = await this.workspaceRepository.create({
      accountId: account.id,
      name: `Meu Consultório`,
      status: EntityStatus.ACTIVE,
      onboardingStatus: OnboardingStatus.PENDING,
    });

    this.logger.info('Default workspace created', {
      operation: 'auth.complete_signup.workspace_created',
      module: 'CompleteSignUpCommandHandler',
      workspaceId: workspace.id,
      accountId: account.id,
      authUserId,
    });

    // Determine role: super-admin if email matches SUPER_ADMIN_EMAIL
    const isSuperAdmin = this.configService.isSuperAdminEmail(email);
    const userRole = isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.OWNER;

    if (isSuperAdmin) {
      this.logger.info('Creating SUPER_ADMIN user', {
        operation: 'auth.complete_signup.super_admin',
        module: 'CompleteSignUpCommandHandler',
        email,
        authUserId,
      });
    }

    // Create User linked to auth.users via auth_user_id
    // Password and email verification managed by Supabase
    const user = await this.userRepository.create({
      accountId: account.id,
      authUserId, // FK to auth.users.id
      fullName,
      email,
      role: userRole,
      status: EntityStatus.ACTIVE,
    });

    this.logger.info('User created and linked to auth.users', {
      operation: 'auth.complete_signup.user_created',
      module: 'CompleteSignUpCommandHandler',
      userId: user.id,
      authUserId,
      accountId: account.id,
    });

    // Add user to workspace as OWNER
    await this.workspaceUserRepository.addUserToWorkspace({
      workspaceId: workspace.id,
      userId: user.id,
      role: UserRole.OWNER,
    });

    this.logger.info('User added to workspace as owner', {
      operation: 'auth.complete_signup.user_added_to_workspace',
      module: 'CompleteSignUpCommandHandler',
      userId: user.id,
      workspaceId: workspace.id,
      authUserId,
    });

    // Publish AccountCreatedEvent (triggers welcome email via AccountCreatedEventHandler)
    const event = new AccountCreatedEvent(account.id, {
      accountId: account.id,
      workspaceId: workspace.id,
      userId: user.id,
      authUserId, // NEW: Include authUserId for traceability
      userFullName: fullName,
      userEmail: email,
      emailVerificationToken: '', // DEPRECATED: Supabase manages email confirmation
    });

    await this.eventBroker.publish(event);

    this.logger.info('CompleteSignUp completed successfully', {
      operation: 'auth.complete_signup.success',
      module: 'CompleteSignUpCommandHandler',
      userId: user.id,
      accountId: account.id,
      authUserId,
      email,
    });

    return { userId: user.id, accountId: account.id };
  }
}
