import type { EntityStatus } from '@agentics/domain';

/**
 * DTO de resposta contendo dados públicos do usuário
 * Excluindo informações sensíveis como passwordHash e tokens
 */
export interface UserResponseDto {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}
