import { ExceptionEventRepository } from '../repositories/exceptionEvent.repository';
import { CouponRepository } from '../repositories/coupon.repository';
import { VerificationRepository } from '../repositories/verification.repository';
import { GateRepository } from '../repositories/gate.repository';
import { VisitorVoucherRepository } from '../repositories/visitorVoucher.repository';
import { ReconciliationBatchRepository } from '../repositories/reconciliationBatch.repository';
import { RuleConfigRepository } from '../repositories/ruleConfig.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { StatusFlowRepository } from '../repositories/statusFlow.repository';
import { ExceptionEvent, CreateExceptionEventDTO, UpdateExceptionEventDTO, ExceptionSuggestionInput, ExceptionSuggestionResult } from '../models/exceptionEvent.model';

export class ExceptionEventService {
  private exceptionEventRepo: ExceptionEventRepository;
  private couponRepo: CouponRepository;
  private verificationRepo: VerificationRepository;
  private gateRepo: GateRepository;
  private voucherRepo: VisitorVoucherRepository;
  private reconciliationBatchRepo: ReconciliationBatchRepository;
  private ruleConfigRepo: RuleConfigRepository;
  private auditLogRepo: AuditLogRepository;
  private statusFlowRepo: StatusFlowRepository;

  constructor() {
    this.exceptionEventRepo = new ExceptionEventRepository();
    this.couponRepo = new CouponRepository();
    this.verificationRepo = new VerificationRepository();
    this.gateRepo = new GateRepository();
    this.voucherRepo = new VisitorVoucherRepository();
    this.reconciliationBatchRepo = new ReconciliationBatchRepository();
    this.ruleConfigRepo = new RuleConfigRepository();
    this.auditLogRepo = new AuditLogRepository();
    this.statusFlowRepo = new StatusFlowRepository();
  }

  getAllExceptionEvents(filters?: any): ExceptionEvent[] {
    return this.exceptionEventRepo.findAll(filters);
  }

  getExceptionEventById(id: string): ExceptionEvent | undefined {
    return this.exceptionEventRepo.findById(id);
  }

  createExceptionEvent(dto: CreateExceptionEventDTO, operator: string): ExceptionEvent {
    const event = this.exceptionEventRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'exception_event',
      entity_id: event.id,
      new_value: JSON.stringify(event)
    });

    return event;
  }

  updateExceptionEvent(id: string, dto: UpdateExceptionEventDTO, operator: string): ExceptionEvent {
    const event = this.exceptionEventRepo.findById(id);
    if (!event) {
      throw new Error('异常事件不存在');
    }

    if (dto.status) {
      const canTransition = this.statusFlowRepo.canTransition('exception_event', event.status, dto.status);
      if (!canTransition) {
        throw new Error(`不允许从 ${event.status} 状态转换到 ${dto.status}`);
      }
    }

    const updated = this.exceptionEventRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'exception_event',
        entity_id: id,
        old_value: JSON.stringify(event),
        new_value: JSON.stringify(updated)
      });

      if (dto.status && dto.status !== event.status) {
        this.statusFlowRepo.create({
          entity_type: 'exception_event',
          entity_id: id,
          from_status: event.status,
          to_status: dto.status,
          operator,
          operate_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    }

    return updated!;
  }

  deleteExceptionEvent(id: string, operator: string): boolean {
    const event = this.exceptionEventRepo.findById(id);
    if (!event) {
      throw new Error('异常事件不存在');
    }

    const result = this.exceptionEventRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'exception_event',
        entity_id: id,
        old_value: JSON.stringify(event)
      });
    }

    return result;
  }

  calculateSuggestion(input: ExceptionSuggestionInput): ExceptionSuggestionResult {
    return this.exceptionEventRepo.calculateSuggestion(input);
  }

  createDuplicateEvent(couponCode: string, verificationId: string, operator: string): ExceptionEvent {
    const coupon = this.couponRepo.findByCode(couponCode);
    if (!coupon) {
      throw new Error('券码不存在');
    }

    const threshold = this.ruleConfigRepo.getThreshold('DUPLICATE_THRESHOLD') || 1;
    const count = this.verificationRepo.countDuplicateByCouponCode(couponCode);

    const eventNo = `DUP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const event = this.exceptionEventRepo.create({
      event_no: eventNo,
      event_type: '重复核销',
      coupon_id: coupon.id,
      verification_id: verificationId,
      batch_no: coupon.batch_no,
      severity: count >= threshold ? '严重' : '一般',
      trigger_fields: JSON.stringify({ coupon_code: couponCode, duplicate_count: count }),
      threshold_value: threshold,
      handler: operator,
      handle_deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
    });

    this.auditLogRepo.create({
      operator,
      operation: '创建重复核销事件',
      entity_type: 'exception_event',
      entity_id: event.id,
      new_value: JSON.stringify(event)
    });

    return event;
  }

  handleEvent(id: string, handler: string, handleResult: string): ExceptionEvent {
    const event = this.exceptionEventRepo.findById(id);
    if (!event) {
      throw new Error('异常事件不存在');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return this.updateExceptionEvent(id, {
      status: '已处理',
      handler,
      handle_time: now,
      handle_result: handleResult
    }, handler);
  }
}
