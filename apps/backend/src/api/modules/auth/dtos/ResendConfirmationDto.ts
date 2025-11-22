import { IsEmail } from 'class-validator';

export class ResendConfirmationDto {
  @IsEmail({}, { message: 'Email deve ser válido' })
  email!: string;
}
