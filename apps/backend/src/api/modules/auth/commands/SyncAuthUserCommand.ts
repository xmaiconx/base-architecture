import { ICommand } from '@fnd/backend';

/**
 * SyncAuthUserCommand
 *
 * Command to synchronize a Supabase auth user with the application database.
 * Used by AuthReconciliationWorker to handle edge cases where webhook delivery failed.
 *
 * Idempotent: Safe to execute multiple times for the same authUserId.
 */
export class SyncAuthUserCommand implements ICommand {
  public readonly type = 'SyncAuthUserCommand';

  constructor(
    public readonly authUserId: string,
    public readonly email: string,
    public readonly fullName: string,
  ) {}
}
