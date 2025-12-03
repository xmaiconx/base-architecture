/**
 * Domain Entities - Frontend Types
 * Mirrored from @fnd/domain
 */

// Entity Status Enum
export type EntityStatus = 'active' | 'inactive' | 'suspended' | 'archived';

// Onboarding Status Enum
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

// User Role Enum
export type UserRole = 'user' | 'admin' | 'super_admin';

// Account Entity
export interface Account {
  id: string;
  name: string;
  gatewayCustomerId?: string;
  settings?: object;
  status: EntityStatus;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Entity
export interface User {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Workspace Entity
export interface Workspace {
  id: string;
  accountId: string;
  name: string;
  settings?: object;
  status: EntityStatus;
  onboardingStatus: OnboardingStatus;
  archivedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Workspace User Entity
export interface WorkspaceUser {
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: Date;
}
