import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SharedModule } from '../../../shared/shared.module';
import { AuthController } from './auth.controller';
import { SupabaseWebhookController } from './supabase-webhook.controller';
import { AuthService } from './auth.service';
import { RoleElevationService } from './services/role-elevation.service';
import { CompleteSignUpCommandHandler, SyncAuthUserCommandHandler } from './commands';
import { AccountCreatedEventHandler, ConfirmationEmailResentEventHandler } from './events';

@Module({
  imports: [
    CqrsModule,
    SharedModule,
  ],
  controllers: [AuthController, SupabaseWebhookController],
  providers: [
    AuthService,
    RoleElevationService,
    CompleteSignUpCommandHandler,
    SyncAuthUserCommandHandler,
    AccountCreatedEventHandler,
    ConfirmationEmailResentEventHandler,
  ],
  exports: [AuthService, RoleElevationService],
})
export class AuthModule {}