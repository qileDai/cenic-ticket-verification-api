import { VerificationRepository } from '../repositories/verification.repository';
import { CouponRepository } from '../repositories/coupon.repository';
import { ExceptionEventRepository } from '../repositories/exceptionEvent.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { StatusFlowRepository } from '../repositories/statusFlow.repository';
import { Verification, CreateVerificationDTO, UpdateVerificationDTO, ImportVerificationDTO, ImportPreviewResult } from '../models/verification.model';

export class VerificationService {
  private verificationRepo: VerificationRepository;
  private couponRepo: CouponRepository;
  private exceptionEventRepo: ExceptionEventRepository;
  private auditLogRepo: AuditLogRepository;
  private statusFlowRepo: StatusFlowRepository;

  constructor() {
    this.verificationRepo = new VerificationRepository();
    this.couponRepo = new CouponRepository();
    this.exceptionEventRepo = new ExceptionEventRepository();
    this.auditLogRepo = new AuditLogRepository();
    this.statusFlowRepo = new StatusFlowRepository();
  }

  getAllVerifications(filters?: any): Verification[] {
    return this.verificationRepo.findAll(filters);
  }

  getVerificationById(id: string): Verification | undefined {
    return this.verificationRepo.findById(id);
  }

  createVerification(dto: CreateVerificationDTO, operator: string): Verification {
    const coupon = this.couponRepo.findById(dto.coupon_id);
    if (!coupon) {
      throw new Error('券码不存在');
    }

    if (coupon.status === '已核销') {
      throw new Error('券码已核销，属于重复核销');
    }

    if (coupon.status === '已过期') {
      throw new Error('券码已过期');
    }

    if (coupon.status === '已作废') {
      throw new Error('券码已作废');
    }

    const verification = this.verificationRepo.create(dto);

    if (coupon.status !== '异常') {
      this.couponRepo.update(dto.coupon_id, { status: '已核销' });
    }

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'verification',
      entity_id: verification.id,
      new_value: JSON.stringify(verification)
    });

    return verification;
  }

  updateVerification(id: string, dto: UpdateVerificationDTO, operator: string): Verification {
    const verification = this.verificationRepo.findById(id);
    if (!verification) {
      throw new Error('核销记录不存在');
    }

    const updated = this.verificationRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'verification',
        entity_id: id,
        old_value: JSON.stringify(verification),
        new_value: JSON.stringify(updated)
      });
    }

    return updated!;
  }

  deleteVerification(id: string, operator: string): boolean {
    const verification = this.verificationRepo.findById(id);
    if (!verification) {
      throw new Error('核销记录不存在');
    }

    const result = this.verificationRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'verification',
        entity_id: id,
        old_value: JSON.stringify(verification)
      });
    }

    return result;
  }

  importPreview(items: ImportVerificationDTO[]): ImportPreviewResult[] {
    return this.verificationRepo.importPreview(items);
  }

  batchImport(items: ImportVerificationDTO[], operator: string): { success: number; failed: number; results: ImportPreviewResult[] } {
    const previewResults = this.importPreview(items);
    const validItems: CreateVerificationDTO[] = [];
    let failed = 0;

    for (const result of previewResults) {
      if (result.valid) {
        const coupon = this.couponRepo.findByCode(result.data.coupon_code);
        if (coupon) {
          validItems.push({
            coupon_id: coupon.id,
            coupon_code: result.data.coupon_code,
            gate_id: result.data.gate_id,
            verification_time: result.data.verification_time,
            verification_type: result.data.verification_type,
            operator: result.data.operator,
            device_no: result.data.device_no,
            batch_no: result.data.batch_no
          });
        }
      } else {
        failed++;
      }
    }

    if (validItems.length > 0) {
      this.verificationRepo.batchCreate(validItems);
    }

    this.auditLogRepo.create({
      operator,
      operation: '批量导入',
      entity_type: 'verification',
      new_value: JSON.stringify({ total: items.length, success: validItems.length, failed })
    });

    return {
      success: validItems.length,
      failed,
      results: previewResults
    };
  }

  checkDuplicate(couponCode: string, batchNo?: string): { isDuplicate: boolean; count: number; verifications: Verification[] } {
    const verifications = this.verificationRepo.findByCouponCode(couponCode);
    const count = verifications.length;

    return {
      isDuplicate: count > 0,
      count,
      verifications
    };
  }

  triageException(verificationId: string, operator: string): { success: boolean; message: string; exceptionEventId?: string } {
    const verification = this.verificationRepo.findById(verificationId);
    if (!verification) {
      throw new Error('核销记录不存在');
    }

    const coupon = this.couponRepo.findById(verification.coupon_id);
    if (!coupon) {
      throw new Error('关联券码不存在');
    }

    const errors: string[] = [];

    if (!verification.gate_id) {
      errors.push('缺少闸机信息');
    }

    if (!verification.device_no) {
      errors.push('缺少设备编号');
    }

    if (!verification.batch_no) {
      errors.push('缺少批次号');
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `分诊失败，缺少关键字段：${errors.join('、')}，请先保存为草稿`
      };
    }

    const eventNo = `EXC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const exceptionEvent = this.exceptionEventRepo.create({
      event_no: eventNo,
      event_type: '核销异常',
      coupon_id: verification.coupon_id,
      verification_id: verificationId,
      gate_id: verification.gate_id,
      batch_no: verification.batch_no,
      severity: '一般',
      trigger_fields: JSON.stringify({ verification_status: verification.status }),
      handler: operator,
      handle_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
    });

    this.verificationRepo.update(verificationId, { status: '异常' });

    this.auditLogRepo.create({
      operator,
      operation: '分诊异常',
      entity_type: 'verification',
      entity_id: verificationId,
      new_value: JSON.stringify({ exceptionEventId: exceptionEvent.id })
    });

    return {
      success: true,
      message: '异常分诊成功，已创建异常事件',
      exceptionEventId: exceptionEvent.id
    };
  }
}
