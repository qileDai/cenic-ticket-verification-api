import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { Verification, CreateVerificationDTO, UpdateVerificationDTO, ImportVerificationDTO, ImportPreviewResult } from '../models/verification.model';

export class VerificationRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; batch_no?: string; coupon_code?: string; operator?: string }): Verification[] {
    let sql = 'SELECT * FROM verifications WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.batch_no) {
      sql += ' AND batch_no = ?';
      params.push(filters.batch_no);
    }
    if (filters?.coupon_code) {
      sql += ' AND coupon_code = ?';
      params.push(filters.coupon_code);
    }
    if (filters?.operator) {
      sql += ' AND operator = ?';
      params.push(filters.operator);
    }

    sql += ' ORDER BY verification_time DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as Verification[];
  }

  findById(id: string): Verification | undefined {
    const stmt = this.db.prepare('SELECT * FROM verifications WHERE id = ?');
    return stmt.get(id) as Verification | undefined;
  }

  findByCouponId(couponId: string): Verification[] {
    const stmt = this.db.prepare('SELECT * FROM verifications WHERE coupon_id = ? ORDER BY verification_time DESC');
    return stmt.all(couponId) as Verification[];
  }

  findByCouponCode(couponCode: string): Verification[] {
    const stmt = this.db.prepare('SELECT * FROM verifications WHERE coupon_code = ? ORDER BY verification_time DESC');
    return stmt.all(couponCode) as Verification[];
  }

  create(dto: CreateVerificationDTO): Verification {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO verifications (id, coupon_id, coupon_code, gate_id, verification_time, verification_type, 
        status, operator, device_no, batch_no, exception_reason, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.coupon_id, dto.coupon_code, dto.gate_id || null, dto.verification_time,
      dto.verification_type, '正常', dto.operator, dto.device_no || null,
      dto.batch_no, dto.exception_reason || null, dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateVerificationDTO): Verification | undefined {
    const verification = this.findById(id);
    if (!verification) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.exception_reason !== undefined) { updates.push('exception_reason = ?'); params.push(dto.exception_reason); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return verification;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE verifications SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM verifications WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  countDuplicateByCouponCode(couponCode: string, excludeId?: string): number {
    let sql = 'SELECT COUNT(*) as count FROM verifications WHERE coupon_code = ?';
    const params: any[] = [couponCode];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  importPreview(items: ImportVerificationDTO[]): ImportPreviewResult[] {
    const results: ImportPreviewResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const errors: string[] = [];
      let couponExists = false;
      let couponStatus = '';
      let isDuplicate = false;

      const couponStmt = this.db.prepare('SELECT * FROM coupons WHERE code = ?');
      const coupon = couponStmt.get(item.coupon_code) as any;

      if (!coupon) {
        errors.push('券码不存在');
      } else {
        couponExists = true;
        couponStatus = coupon.status;

        if (coupon.status === '已核销') {
          isDuplicate = true;
          errors.push('券码已核销，属于重复核销');
        } else if (coupon.status === '已过期') {
          errors.push('券码已过期');
        } else if (coupon.status === '已作废') {
          errors.push('券码已作废');
        }
      }

      const existingCount = this.countDuplicateByCouponCode(item.coupon_code);
      if (existingCount > 0) {
        isDuplicate = true;
        if (!errors.includes('券码已核销，属于重复核销')) {
          errors.push('券码已有核销记录，属于重复核销');
        }
      }

      results.push({
        row: i + 1,
        data: item,
        valid: errors.length === 0,
        errors,
        coupon_exists: couponExists,
        coupon_status: couponStatus,
        is_duplicate: isDuplicate
      });
    }

    return results;
  }

  batchCreate(items: CreateVerificationDTO[]): Verification[] {
    const insert = this.db.transaction((items: CreateVerificationDTO[]) => {
      return items.map(item => this.create(item));
    });

    return insert(items);
  }

  count(filters?: { status?: string; batch_no?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM verifications WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.batch_no) {
      sql += ' AND batch_no = ?';
      params.push(filters.batch_no);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}
