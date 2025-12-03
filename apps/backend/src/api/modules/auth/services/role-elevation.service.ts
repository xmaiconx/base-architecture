import { Injectable, Inject } from '@nestjs/common';
import { User, UserRole } from '@fnd/domain';
import { IUserRepository } from '@fnd/database';
import { ILoggerService, IConfigurationService } from '@fnd/backend';

/**
 * Serviço responsável por elevar usuários ao role de SUPER_ADMIN
 * quando o email corresponde ao configurado em SUPER_ADMIN_EMAIL.
 *
 * Este serviço é chamado durante o login para garantir que usuários
 * existentes sejam elevados automaticamente quando a configuração mudar.
 */
@Injectable()
export class RoleElevationService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    @Inject('IConfigurationService') private readonly configService: IConfigurationService,
  ) {}

  /**
   * Verifica se o usuário deve ser super-admin e eleva se necessário.
   *
   * @param user - Usuário a ser verificado
   * @returns Usuário atualizado (ou o mesmo se não precisar atualizar)
   */
  async checkAndElevateUser(user: User): Promise<User> {
    // Verificar se o email do usuário corresponde ao super-admin configurado
    const shouldBeSuperAdmin = this.configService.isSuperAdminEmail(user.email);

    // Se já é super-admin ou não deveria ser, retornar usuário sem mudanças
    if (user.role === UserRole.SUPER_ADMIN || !shouldBeSuperAdmin) {
      return user;
    }

    // Usuário deveria ser super-admin mas não é - elevar
    this.logger.info('Elevating user to SUPER_ADMIN', {
      operation: 'auth.elevation.super_admin',
      module: 'RoleElevationService',
      userId: user.id,
      email: user.email,
      previousRole: user.role,
    });

    // Atualizar role no banco de dados
    const updatedUser = await this.userRepository.update(user.id, {
      role: UserRole.SUPER_ADMIN,
    });

    this.logger.info('User elevated to SUPER_ADMIN successfully', {
      operation: 'auth.elevation.success',
      module: 'RoleElevationService',
      userId: user.id,
      email: user.email,
    });

    return updatedUser;
  }
}
