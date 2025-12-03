import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLogRepository } from '@fnd/database';
import { SharedModule } from '../../../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [
    AuditService,
    {
      provide: 'IAuditLogRepository',
      useClass: AuditLogRepository,
    },
  ],
  controllers: [AuditController],
})
export class AuditModule {}
