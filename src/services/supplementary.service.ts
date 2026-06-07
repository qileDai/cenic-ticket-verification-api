import { SupplementaryRepository } from '../repositories/supplementary.repository';
import { VisitorVoucherRepository } from '../repositories/visitorVoucher.repository';
import { VerificationRepository } from '../repositories/verification.repository';
import { CouponRepository } from '../repositories/coupon.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { StatusFlowRepository } from '../repositories/statusFlow.repository';
import { SupplementaryApplication, CreateSupplementaryDTO, UpdateSupplementaryDTO, ReviewSupplementaryDTO } from '../models/supplementary.model';

export class SupplementaryService {
  private supplementaryRepo: SupplementaryRepository;
  private voucherRepo: VisitorVoucherRepository;
  private verificationRepo: VerificationRepository;
  private couponRepo: CouponRepository;
  private auditLogRepo: AuditLogRepository;
  private statusFlowRepo: StatusFlowRepository;

  constructor() {
    this.supplementaryRepo = new SupplementaryRepository();
    this.voucherRepo = new VisitorVoucherRepository();
    this.verificationRepo = new VerificationRepository();
    this.couponRepo = new CouponRepository();
    this.auditLogRepo = new AuditLogRepository();
    this.statusFlowRepo = new StatusFlowRepository();
  }

  getAllSupplementaries(filters?: any): SupplementaryApplication[] {
    return this.supplementaryRepo.findAll(filters);
  }

  getSupplementaryById(id: string): SupplementaryApplication | undefined {
    return this.supplementaryRepo.findById(id);
  }

  createSupplementary(dto: CreateSupplementaryDTO, operator: string): SupplementaryApplication {
    const verification = this.verificationRepo.findById(dto.verification_id);
    if (!verification) {
      throw new Error('核销记录不存在');
    }

    const coupon = this.couponRepo.findById(dto.coupon_id);
    if (!coupon) {
      throw new Error('券码不存在');
    }

    const supplementary = this.supplementaryRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'supplementary',
      entity_id: supplementary.id,
      new_value: JSON.stringify(supplementary)
    });

    return supplementary;
  }

  updateSupplementary(id: string, dto: UpdateSupplementaryDTO, operator: string): SupplementaryApplication {
    const supplementary = this.supplementaryRepo.findById(id);
    if (!supplementary) {
      throw new Error('补录申请不存在');
    }

    if (dto.status) {
      const canTransition = this.statusFlowRepo.canTransition('supplementary', supplementary.status, dto.status);
      if (!canTransition) {
        throw new Error(`不允许从 ${supplementary.status} 状态转换到 ${dto.status}`);
      }
    }

    const updated = this.supplementaryRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'supplementary',
        entity_id: id,
        old_value: JSON.stringify(supplementary),
        new_value: JSON.stringify(updated)
      });

      if (dto.status && dto.status !== supplementary.status) {
        this.statusFlowRepo.create({
          entity_type: 'supplementary',
          entity_id: id,
          from_status: supplementary.status,
          to_status: dto.status,
          operator,
          operate_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    }

    return updated!;
  }

  reviewSupplementary(id: string, dto: ReviewSupplementaryDTO): SupplementaryApplication {
    const supplementary = this.supplementaryRepo.findById(id);
    if (!supplementary) {
      throw new Error('补录申请不存在');
    }

    if (dto.status === '已驳回' && !dto.review_comment) {
      throw new Error('驳回必须填写原因');
    }

    const canTransition = this.statusFlowRepo.canTransition('supplementary', supplementary.status, dto.status);
    if (!canTransition) {
      throw new Error(`不允许从 ${supplementary.status} 状态转换到 ${dto.status}`);
    }

    const reviewed = this.supplementaryRepo.review(id, dto);

    if (reviewed) {
      this.auditLogRepo.create({
        operator: dto.reviewer,
        operation: '复核',
        entity_type: 'supplementary',
        entity_id: id,
        old_value: JSON.stringify(supplementary),
        new_value: JSON.stringify(reviewed)
      });

      this.statusFlowRepo.create({
        entity_type: 'supplementary',
        entity_id: id,
        from_status: supplementary.status,
        to_status: dto.status,
        operator: dto.reviewer,
        operate_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        reason: dto.review_comment
      });
    }

    return reviewed!;
  }

  deleteSupplementary(id: string, operator: string): boolean {
    const supplementary = this.supplementaryRepo.findById(id);
    if (!supplementary) {
      throw new Error('补录申请不存在');
    }

    const result = this.supplementaryRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'supplementary',
        entity_id: id,
        old_value: JSON.stringify(supplementary)
      });
    }

    return result;
  }

  reviewVouchers(supplementaryId: string, operator: string): { success: boolean; message: string; verifiedCount: number } {
    const supplementary = this.supplementaryRepo.findById(supplementaryId);
    if (!supplementary) {
      throw new Error('补录申请不存在');
    }

    if (!supplementary.voucher_ids) {
      return {
        success: false,
        message: '未关联游客凭证',
        verifiedCount: 0
      };
    }

    const voucherIds = supplementary.voucher_ids.split(',').filter(id => id.trim());
    let verifiedCount = 0;

    for (const voucherId of voucherIds) {
      const voucher = this.voucherRepo.findById(voucherId.trim());
      if (voucher && voucher.verify_status === '验证通过') {
        verifiedCount++;
      }
    }

    if (verifiedCount === voucherIds.length) {
      return {
        success: true,
        message: '所有游客凭证验证通过',
        verifiedCount
      };
    } else if (verifiedCount > 0) {
      return {
        success: false,
        message: `部分游客凭证验证通过 (${verifiedCount}/${voucherIds.length})`,
        verifiedCount
      };
    } else {
      return {
        success: false,
        message: '所有游客凭证验证失败或待验证',
        verifiedCount: 0
      };
    }
  }
}
