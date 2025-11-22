import { IsString, MinLength } from 'class-validator';

export class ConfirmEmailDto {
  @IsString({ message: 'Token deve ser um texto' })
  @MinLength(1, { message: 'Token é obrigatório' })
  token!: string;
}
