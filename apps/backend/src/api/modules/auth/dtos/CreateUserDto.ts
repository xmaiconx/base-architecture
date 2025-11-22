export interface CreateUserDto {
  accountId: string;
  fullName: string;
  email: string;
  password: string;
  role?: string;
}
