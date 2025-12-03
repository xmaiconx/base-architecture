import type { EntityStatus } from '@agentics/domain';

/**
 * DTO de resposta contendo dados públicos do usuário
 * Email verification is now managed by Supabase Auth
 */
export interface UserResponseDto {
  id: string;
  accountId: string;
  authUserId: string | null;
  fullName: string;
  email: string;
  role: string;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}
