import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { BillingModule } from './modules/billing/billing.module';
import { SharedModule } from '../shared/shared.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SharedModule,
    AuthModule,
    WorkspaceModule,
    BillingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}