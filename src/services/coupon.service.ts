import { CouponRepository } from '../repositories/coupon.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { StatusFlowRepository } from '../repositories/statusFlow.repository';
import { Coupon, CreateCouponDTO, UpdateCouponDTO } from '../models/coupon.model';

export class CouponService {
  private couponRepo: CouponRepository;
  private auditLogRepo: AuditLogRepository;
  private statusFlowRepo: StatusFlowRepository;

  constructor() {
    this.couponRepo = new CouponRepository();
    this.auditLogRepo = new AuditLogRepository();
    this.statusFlowRepo = new StatusFlowRepository();
  }

  getAllCoupons(filters?: any): Coupon[] {
    return this.couponRepo.findAll(filters);
  }

  getCouponById(id: string): Coupon | undefined {
    return this.couponRepo.findById(id);
  }

  getCouponByCode(code: string): Coupon | undefined {
    return this.couponRepo.findByCode(code);
  }

  createCoupon(dto: CreateCouponDTO, operator: string): Coupon {
    const existing = this.couponRepo.findByCode(dto.code);
    if (existing) {
      throw new Error('券码已存在');
    }

    const coupon = this.couponRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'coupon',
      entity_id: coupon.id,
      new_value: JSON.stringify(coupon)
    });

    return coupon;
  }

  updateCoupon(id: string, dto: UpdateCouponDTO, operator: string): Coupon {
    const coupon = this.couponRepo.findById(id);
    if (!coupon) {
      throw new Error('券码不存在');
    }

    if (dto.status) {
      const canTransition = this.statusFlowRepo.canTransition('coupon', coupon.status, dto.status);
      if (!canTransition) {
        throw new Error(`不允许从 ${coupon.status} 状态转换到 ${dto.status}`);
      }

      const requiresReason = this.statusFlowRepo.requiresReason('coupon', coupon.status);
      if (requiresReason && !dto.remark) {
        throw new Error('状态转换需要填写原因');
      }
    }

    const updated = this.couponRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'coupon',
        entity_id: id,
        old_value: JSON.stringify(coupon),
        new_value: JSON.stringify(updated)
      });

      if (dto.status && dto.status !== coupon.status) {
        this.statusFlowRepo.create({
          entity_type: 'coupon',
          entity_id: id,
          from_status: coupon.status,
          to_status: dto.status,
          operator,
          operate_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          reason: dto.remark
        });
      }
    }

    return updated!;
  }

  deleteCoupon(id: string, operator: string): boolean {
    const coupon = this.couponRepo.findById(id);
    if (!coupon) {
      throw new Error('券码不存在');
    }

    const result = this.couponRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'coupon',
        entity_id: id,
        old_value: JSON.stringify(coupon)
      });
    }

    return result;
  }

  getStatusTransitions(id: string) {
    const coupon = this.couponRepo.findById(id);
    if (!coupon) {
      throw new Error('券码不存在');
    }

    return this.statusFlowRepo.getTransitions('coupon', coupon.status);
  }
}
