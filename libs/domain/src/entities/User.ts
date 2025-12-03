import { EntityStatus } from '../enums/EntityStatus';
import { UserRole } from '../enums/UserRole';

export interface User {
  id: string;
  accountId: string;
  authUserId: string | null; // FK to auth.users.id (Supabase Auth)
  fullName: string;
  email: string;
  role: UserRole;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}