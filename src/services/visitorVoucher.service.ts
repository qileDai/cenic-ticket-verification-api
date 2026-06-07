import { VisitorVoucherRepository } from '../repositories/visitorVoucher.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { VisitorVoucher, CreateVisitorVoucherDTO, UpdateVisitorVoucherDTO, VerifyVoucherDTO } from '../models/visitorVoucher.model';

export class VisitorVoucherService {
  private voucherRepo: VisitorVoucherRepository;
  private auditLogRepo: AuditLogRepository;

  constructor() {
    this.voucherRepo = new VisitorVoucherRepository();
    this.auditLogRepo = new AuditLogRepository();
  }

  getAllVouchers(filters?: any): VisitorVoucher[] {
    return this.voucherRepo.findAll(filters);
  }

  getVoucherById(id: string): VisitorVoucher | undefined {
    return this.voucherRepo.findById(id);
  }

  createVoucher(dto: CreateVisitorVoucherDTO, operator: string): VisitorVoucher {
    const voucher = this.voucherRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'visitor_voucher',
      entity_id: voucher.id,
      new_value: JSON.stringify(voucher)
    });

    return voucher;
  }

  updateVoucher(id: string, dto: UpdateVisitorVoucherDTO, operator: string): VisitorVoucher {
    const voucher = this.voucherRepo.findById(id);
    if (!voucher) {
      throw new Error('游客凭证不存在');
    }

    const updated = this.voucherRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'visitor_voucher',
        entity_id: id,
        old_value: JSON.stringify(voucher),
        new_value: JSON.stringify(updated)
      });
    }

    return updated!;
  }

  verifyVoucher(id: string, dto: VerifyVoucherDTO): VisitorVoucher {
    const voucher = this.voucherRepo.findById(id);
    if (!voucher) {
      throw new Error('游客凭证不存在');
    }

    const verified = this.voucherRepo.verify(id, dto);

    if (verified) {
      this.auditLogRepo.create({
        operator: dto.verifier,
        operation: '验证',
        entity_type: 'visitor_voucher',
        entity_id: id,
        old_value: JSON.stringify(voucher),
        new_value: JSON.stringify(verified)
      });
    }

    return verified!;
  }

  deleteVoucher(id: string, operator: string): boolean {
    const voucher = this.voucherRepo.findById(id);
    if (!voucher) {
      throw new Error('游客凭证不存在');
    }

    const result = this.voucherRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'visitor_voucher',
        entity_id: id,
        old_value: JSON.stringify(voucher)
      });
    }

    return result;
  }
}
