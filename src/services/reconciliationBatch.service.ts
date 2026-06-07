import { ReconciliationBatchRepository } from '../repositories/reconciliationBatch.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { ReconciliationBatch, CreateReconciliationBatchDTO, UpdateReconciliationBatchDTO, ReconciliationDifference } from '../models/reconciliationBatch.model';

export class ReconciliationBatchService {
  private reconciliationBatchRepo: ReconciliationBatchRepository;
  private auditLogRepo: AuditLogRepository;

  constructor() {
    this.reconciliationBatchRepo = new ReconciliationBatchRepository();
    this.auditLogRepo = new AuditLogRepository();
  }

  getAllBatches(filters?: any): ReconciliationBatch[] {
    return this.reconciliationBatchRepo.findAll(filters);
  }

  getBatchById(id: string): ReconciliationBatch | undefined {
    return this.reconciliationBatchRepo.findById(id);
  }

  getBatchByNo(batchNo: string): ReconciliationBatch | undefined {
    return this.reconciliationBatchRepo.findByBatchNo(batchNo);
  }

  createBatch(dto: CreateReconciliationBatchDTO, operator: string): ReconciliationBatch {
    const existing = this.reconciliationBatchRepo.findByBatchNo(dto.batch_no);
    if (existing) {
      throw new Error('批次号已存在');
    }

    const batch = this.reconciliationBatchRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'reconciliation_batch',
      entity_id: batch.id,
      new_value: JSON.stringify(batch)
    });

    return batch;
  }

  updateBatch(id: string, dto: UpdateReconciliationBatchDTO, operator: string): ReconciliationBatch {
    const batch = this.reconciliationBatchRepo.findById(id);
    if (!batch) {
      throw new Error('对账批次不存在');
    }

    const updated = this.reconciliationBatchRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'reconciliation_batch',
        entity_id: id,
        old_value: JSON.stringify(batch),
        new_value: JSON.stringify(updated)
      });
    }

    return updated!;
  }

  deleteBatch(id: string, operator: string): boolean {
    const batch = this.reconciliationBatchRepo.findById(id);
    if (!batch) {
      throw new Error('对账批次不存在');
    }

    const result = this.reconciliationBatchRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'reconciliation_batch',
        entity_id: id,
        old_value: JSON.stringify(batch)
      });
    }

    return result;
  }

  calculateDifference(batchNo: string): ReconciliationDifference | undefined {
    return this.reconciliationBatchRepo.calculateDifference(batchNo);
  }

  startReconciliation(id: string, operator: string): ReconciliationBatch {
    const batch = this.reconciliationBatchRepo.findById(id);
    if (!batch) {
      throw new Error('对账批次不存在');
    }

    if (batch.status !== '待对账') {
      throw new Error('只有待对账状态的批次才能开始对账');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return this.reconciliationBatchRepo.update(id, {
      status: '对账中',
      start_time: now
    })!;
  }

  completeReconciliation(id: string, operator: string): ReconciliationBatch {
    const batch = this.reconciliationBatchRepo.findById(id);
    if (!batch) {
      throw new Error('对账批次不存在');
    }

    if (batch.status !== '对账中') {
      throw new Error('只有对账中状态的批次才能完成对账');
    }

    const difference = this.calculateDifference(batch.batch_no);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const status = difference && difference.difference_count > 0 ? '有差异' : '已完成';

    const updated = this.reconciliationBatchRepo.update(id, {
      status,
      end_time: now
    })!;

    this.auditLogRepo.create({
      operator,
      operation: '完成对账',
      entity_type: 'reconciliation_batch',
      entity_id: id,
      new_value: JSON.stringify({ status, difference })
    });

    return updated;
  }
}
