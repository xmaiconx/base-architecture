import { Generated } from 'kysely';

export interface UserTable {
  id: Generated<string>;
  account_id: string;
  auth_user_id: string | null; // FK to auth.users.id (Supabase Auth)
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}