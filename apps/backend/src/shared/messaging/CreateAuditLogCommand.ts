import { CreateAuditLogDto } from '../api/modules/audit/dtos';

export class CreateAuditLogCommand {
  constructor(public readonly dto: CreateAuditLogDto) {}
}
