import { Controller, Post, Body, HttpStatus, HttpCode, Get, UseGuards, Request } from '@nestjs/common';
import { SignUpDto, SignInDto, ConfirmEmailDto, ResendConfirmationDto } from './dtos';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    const result = await this.authService.signUp(signUpDto);
    return {
      message: 'Conta criada com sucesso. Verifique seu email para confirmar.',
      userId: result.userId,
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    const result = await this.authService.signIn(signInDto);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    await this.authService.confirmEmail(confirmEmailDto.token);
    return {
      message: 'Email confirmado com sucesso.',
    };
  }

  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  async resendConfirmation(@Body() resendConfirmationDto: ResendConfirmationDto) {
    await this.authService.resendConfirmation(resendConfirmationDto.email);
    return {
      message: 'Email de confirmação reenviado com sucesso.',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const user = await this.authService.getMe(req.user.userId);
    return {
      user,
    };
  }
}