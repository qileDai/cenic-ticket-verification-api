import { ExceptionReasonRepository } from '../repositories/exceptionReason.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { ExceptionReason, CreateExceptionReasonDTO, UpdateExceptionReasonDTO } from '../models/exceptionReason.model';

export class ExceptionReasonService {
  private exceptionReasonRepo: ExceptionReasonRepository;
  private auditLogRepo: AuditLogRepository;

  constructor() {
    this.exceptionReasonRepo = new ExceptionReasonRepository();
    this.auditLogRepo = new AuditLogRepository();
  }

  getAllExceptionReasons(filters?: any): ExceptionReason[] {
    return this.exceptionReasonRepo.findAll(filters);
  }

  getExceptionReasonById(id: string): ExceptionReason | undefined {
    return this.exceptionReasonRepo.findById(id);
  }

  createExceptionReason(dto: CreateExceptionReasonDTO, operator: string): ExceptionReason {
    const existing = this.exceptionReasonRepo.findByCode(dto.code);
    if (existing) {
      throw new Error('异常原因编码已存在');
    }

    const reason = this.exceptionReasonRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'exception_reason',
      entity_id: reason.id,
      new_value: JSON.stringify(reason)
    });

    return reason;
  }

  updateExceptionReason(id: string, dto: UpdateExceptionReasonDTO, operator: string): ExceptionReason {
    const reason = this.exceptionReasonRepo.findById(id);
    if (!reason) {
      throw new Error('异常原因不存在');
    }

    const updated = this.exceptionReasonRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'exception_reason',
        entity_id: id,
        old_value: JSON.stringify(reason),
        new_value: JSON.stringify(updated)
      });
    }

    return updated!;
  }

  deleteExceptionReason(id: string, operator: string): boolean {
    const reason = this.exceptionReasonRepo.findById(id);
    if (!reason) {
      throw new Error('异常原因不存在');
    }

    const result = this.exceptionReasonRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'exception_reason',
        entity_id: id,
        old_value: JSON.stringify(reason)
      });
    }

    return result;
  }
}
