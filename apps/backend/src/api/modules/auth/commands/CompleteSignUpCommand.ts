import { ICommand } from '@agentics/backend';

/**
 * CompleteSignUpCommand
 *
 * Triggered by Supabase webhook after auth user is created.
 * Creates Account → Workspace → User in application database,
 * linking User to auth.users via auth_user_id.
 *
 * Replaces legacy SignUpCommand for Supabase Auth integration.
 */
export class CompleteSignUpCommand implements ICommand {
  public readonly type = 'CompleteSignUpCommand';

  constructor(
    public readonly authUserId: string, // UUID from auth.users.id (Supabase)
    public readonly email: string,
    public readonly fullName: string,
  ) {}
}
