/**
 * Auth Module DTOs - Frontend Types
 * Mirrored from backend auth module
 */

export interface SignUpDto {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface ConfirmEmailDto {
  token: string;
}

export interface ResendConfirmationDto {
  email: string;
}

export interface UserResponseDto {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  accountId: string;
  fullName: string;
  email: string;
  password: string;
  role?: string;
}

export interface CreateAccountDto {
  name: string;
  gatewayCustomerId?: string;
  settings?: object;
}

export interface UpdateAccountDto {
  name?: string;
  gatewayCustomerId?: string;
  settings?: object;
}
