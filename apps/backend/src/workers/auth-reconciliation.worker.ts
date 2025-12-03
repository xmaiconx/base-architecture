import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ILoggerService, IScheduleService, IntervalSchedule, ISupabaseService } from '@fnd/backend';
import { IUserRepository } from '@fnd/database';
import { SyncAuthUserCommand } from '../api/modules/auth/commands';

/**
 * AuthReconciliationWorker
 *
 * Cron job that runs every 5 minutes to reconcile Supabase auth users
 * with application database. Handles edge cases where webhook delivery failed.
 *
 * Strategy:
 * 1. Fetch all Supabase auth users
 * 2. Check which ones don't exist in application database
 * 3. Execute SyncAuthUserCommand for each missing user
 * 4. Batch process users to avoid overwhelming the system
 */
@Injectable()
export class AuthReconciliationWorker implements OnModuleInit {
  private readonly BATCH_SIZE = 10; // Process 10 users at a time
  private readonly RECONCILIATION_INTERVAL_MINUTES = 5;

  constructor(
    @Inject('IScheduleService') private readonly scheduleService: IScheduleService,
    @Inject('ISupabaseService') private readonly supabaseService: ISupabaseService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  async onModuleInit() {
    // Schedule job to run every 5 minutes
    await this.scheduleService.scheduleJob(
      'auth-reconciliation',
      new IntervalSchedule(this.RECONCILIATION_INTERVAL_MINUTES),
      this.reconcileAuthUsers.bind(this),
    );

    this.logger.info('AuthReconciliationWorker initialized', {
      operation: 'auth.reconciliation.init',
      module: 'AuthReconciliationWorker',
      intervalMinutes: this.RECONCILIATION_INTERVAL_MINUTES,
    });
  }

  /**
   * Reconcile Supabase auth users with application database
   */
  private async reconcileAuthUsers(): Promise<void> {
    try {
      this.logger.info('Starting auth user reconciliation', {
        operation: 'auth.reconciliation.start',
        module: 'AuthReconciliationWorker',
      });

      // Fetch all Supabase auth users (paginated)
      const authUsers = await this.fetchAllAuthUsers();

      this.logger.info('Fetched auth users from Supabase', {
        operation: 'auth.reconciliation.fetched',
        module: 'AuthReconciliationWorker',
        totalAuthUsers: authUsers.length,
      });

      // Find missing users (auth users without corresponding application users)
      const missingUsers = await this.findMissingUsers(authUsers);

      if (missingUsers.length === 0) {
        this.logger.info('No missing users found - all in sync', {
          operation: 'auth.reconciliation.complete',
          module: 'AuthReconciliationWorker',
          totalAuthUsers: authUsers.length,
          missingUsers: 0,
        });
        return;
      }

      this.logger.warn('Found missing users in application database', {
        operation: 'auth.reconciliation.missing_users',
        module: 'AuthReconciliationWorker',
        missingUsersCount: missingUsers.length,
        authUserIds: missingUsers.map((u) => u.id),
      });

      // Sync missing users in batches
      await this.syncMissingUsers(missingUsers);

      this.logger.info('Auth user reconciliation completed', {
        operation: 'auth.reconciliation.success',
        module: 'AuthReconciliationWorker',
        totalAuthUsers: authUsers.length,
        syncedUsers: missingUsers.length,
      });
    } catch (error) {
      this.logger.error('Auth user reconciliation failed', error as Error, {
        operation: 'auth.reconciliation.error',
        module: 'AuthReconciliationWorker',
        errorObject: error,
      });
      // Don't throw - let the job continue on next schedule
    }
  }

  /**
   * Fetch all auth users from Supabase (handles pagination)
   */
  private async fetchAllAuthUsers(): Promise<Array<{ id: string; email: string; user_metadata?: any }>> {
    const allUsers: Array<{ id: string; email: string; user_metadata?: any }> = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const users = await this.supabaseService.listUsers(page, perPage);

      if (users.length === 0) break;

      allUsers.push(...users);

      if (users.length < perPage) break; // Last page

      page++;
    }

    return allUsers;
  }

  /**
   * Find auth users that don't exist in application database
   */
  private async findMissingUsers(
    authUsers: Array<{ id: string; email: string; user_metadata?: any }>,
  ): Promise<Array<{ id: string; email: string; fullName: string }>> {
    const missingUsers: Array<{ id: string; email: string; fullName: string }> = [];

    for (const authUser of authUsers) {
      const existingUser = await this.userRepository.findByAuthUserId(authUser.id);

      if (!existingUser) {
        const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
        missingUsers.push({
          id: authUser.id,
          email: authUser.email,
          fullName,
        });
      }
    }

    return missingUsers;
  }

  /**
   * Sync missing users in batches
   */
  private async syncMissingUsers(
    missingUsers: Array<{ id: string; email: string; fullName: string }>,
  ): Promise<void> {
    for (let i = 0; i < missingUsers.length; i += this.BATCH_SIZE) {
      const batch = missingUsers.slice(i, i + this.BATCH_SIZE);

      this.logger.info('Processing user sync batch', {
        operation: 'auth.reconciliation.batch',
        module: 'AuthReconciliationWorker',
        batchNumber: Math.floor(i / this.BATCH_SIZE) + 1,
        batchSize: batch.length,
      });

      // Process batch in parallel
      await Promise.all(
        batch.map(async (user) => {
          try {
            const result = await this.commandBus.execute(
              new SyncAuthUserCommand(user.id, user.email, user.fullName),
            );

            this.logger.info('User synced successfully', {
              operation: 'auth.reconciliation.user_synced',
              module: 'AuthReconciliationWorker',
              authUserId: user.id,
              userId: result.userId,
              accountId: result.accountId,
              created: result.created,
            });
          } catch (error) {
            this.logger.error('Failed to sync user', error as Error, {
              operation: 'auth.reconciliation.user_sync_error',
              module: 'AuthReconciliationWorker',
              authUserId: user.id,
              email: user.email,
              errorObject: error,
            });
            // Continue with other users
          }
        }),
      );
    }
  }
}
