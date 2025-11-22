import { Injectable, BadRequestException, UnauthorizedException, Inject, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto, SignInDto, UserResponseDto } from './dtos';
import { User, EntityStatus } from '@agentics/domain';
import { SignUpCommand, ConfirmEmailCommand, ResendConfirmationCommand } from './commands';
import { IUserRepository } from '@agentics/database';
import { ILoggerService } from '@agentics/backend';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly jwtService: JwtService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ userId: string }> {
    const { fullName, email, password } = signUpDto;

    this.logger.info('Delegating signup to command handler', {
      operation: 'auth.signup.delegate',
      module: 'AuthService',
      email,
    });

    const command = new SignUpCommand(fullName, email, password);
    return await this.commandBus.execute(command);
  }

  async signIn(signInDto: SignInDto): Promise<{ accessToken: string; user: Omit<User, 'passwordHash' | 'emailVerificationToken'> }> {
    const { email, password } = signInDto;

    this.logger.info('User signin attempt', {
      operation: 'auth.signin.start',
      module: 'AuthService',
      email,
    });

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warn('Signin attempt with non-existent email', {
        operation: 'auth.signin.user_not_found',
        module: 'AuthService',
        email,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn('Signin attempt with invalid password', {
        operation: 'auth.signin.invalid_password',
        module: 'AuthService',
        userId: user.id,
        email,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.emailVerified) {
      this.logger.warn('Signin attempt with unverified email', {
        operation: 'auth.signin.email_not_verified',
        module: 'AuthService',
        userId: user.id,
        email,
      });
      throw new UnauthorizedException('Email não verificado. Verifique sua caixa de entrada.');
    }

    const payload = { userId: user.id, accountId: user.accountId, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    this.logger.info('User signin successful', {
      operation: 'auth.signin.success',
      module: 'AuthService',
      userId: user.id,
      accountId: user.accountId,
      email,
    });

    const { passwordHash, emailVerificationToken, ...userWithoutSensitiveData } = user;

    return {
      accessToken,
      user: userWithoutSensitiveData,
    };
  }

  async confirmEmail(token: string): Promise<void> {
    this.logger.info('Delegating email confirmation to command handler', {
      operation: 'auth.confirm_email.delegate',
      module: 'AuthService',
    });

    const command = new ConfirmEmailCommand(token);
    return await this.commandBus.execute(command);
  }

  async resendConfirmation(email: string): Promise<void> {
    this.logger.info('Delegating resend confirmation to command handler', {
      operation: 'auth.resend_confirmation.delegate',
      module: 'AuthService',
      email,
    });

    const command = new ResendConfirmationCommand(email);
    return await this.commandBus.execute(command);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    this.logger.info('Fetching current user data', {
      operation: 'auth.get_me.start',
      module: 'AuthService',
      userId,
    });

    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.warn('User not found in getMe', {
        operation: 'auth.get_me.user_not_found',
        module: 'AuthService',
        userId,
      });
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.info('User data fetched successfully', {
      operation: 'auth.get_me.success',
      module: 'AuthService',
      userId,
      accountId: user.accountId,
    });

    // Retornar apenas dados não sensíveis
    const { passwordHash, emailVerificationToken, emailVerificationTokenExpiry, ...userResponse } = user;

    return userResponse;
  }
}