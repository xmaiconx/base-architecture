import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { SyncAuthUserCommand } from '../SyncAuthUserCommand';
import { CompleteSignUpCommand } from '../CompleteSignUpCommand';
import { IUserRepository } from '@fnd/database';
import { ILoggerService } from '@fnd/backend';

/**
 * SyncAuthUserCommandHandler
 *
 * Handles synchronization of Supabase auth users to application database.
 * Used by AuthReconciliationWorker to catch webhook delivery failures.
 *
 * Strategy:
 * 1. Check if user already exists with this authUserId
 * 2. If yes, return existing user (idempotency)
 * 3. If no, delegate to CompleteSignUpCommand for atomic creation
 */
@CommandHandler(SyncAuthUserCommand)
@Injectable()
export class SyncAuthUserCommandHandler implements ICommandHandler<SyncAuthUserCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  async execute(command: SyncAuthUserCommand): Promise<{ userId: string; accountId: string; created: boolean }> {
    const { authUserId, email, fullName } = command;

    this.logger.info('Starting auth user synchronization', {
      operation: 'auth.sync_auth_user.start',
      module: 'SyncAuthUserCommandHandler',
      authUserId,
      email,
    });

    // Idempotency check
    const existingUser = await this.userRepository.findByAuthUserId(authUserId);

    if (existingUser) {
      this.logger.info('Auth user already synchronized', {
        operation: 'auth.sync_auth_user.already_exists',
        module: 'SyncAuthUserCommandHandler',
        authUserId,
        userId: existingUser.id,
        accountId: existingUser.accountId,
      });

      return {
        userId: existingUser.id,
        accountId: existingUser.accountId,
        created: false,
      };
    }

    // User doesn't exist - delegate to CompleteSignUpCommand for atomic creation
    this.logger.info('Creating missing user via CompleteSignUpCommand', {
      operation: 'auth.sync_auth_user.creating',
      module: 'SyncAuthUserCommandHandler',
      authUserId,
      email,
    });

    const result = await this.commandBus.execute(
      new CompleteSignUpCommand(authUserId, email, fullName),
    );

    this.logger.info('Auth user synchronized successfully', {
      operation: 'auth.sync_auth_user.success',
      module: 'SyncAuthUserCommandHandler',
      authUserId,
      userId: result.userId,
      accountId: result.accountId,
    });

    return {
      userId: result.userId,
      accountId: result.accountId,
      created: true,
    };
  }
}
