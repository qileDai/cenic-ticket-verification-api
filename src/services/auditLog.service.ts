import { AuditLogRepository } from '../repositories/auditLog.repository';
import { AuditLog, AuditLogQuery } from '../models/auditLog.model';

export class AuditLogService {
  private auditLogRepo: AuditLogRepository;

  constructor() {
    this.auditLogRepo = new AuditLogRepository();
  }

  getAuditLogs(query: AuditLogQuery): { data: AuditLog[]; total: number; page: number; page_size: number } {
    const { data, total } = this.auditLogRepo.findAll(query);

    return {
      data,
      total,
      page: query.page || 1,
      page_size: query.page_size || 20
    };
  }

  getAuditLogById(id: string): AuditLog | undefined {
    return this.auditLogRepo.findById(id);
  }

  getEntityAuditLogs(entityType: string, entityId: string): AuditLog[] {
    return this.auditLogRepo.findByEntity(entityType, entityId);
  }

  getOperatorAuditLogs(operator: string, limit: number = 100): AuditLog[] {
    return this.auditLogRepo.findByOperator(operator, limit);
  }
}
