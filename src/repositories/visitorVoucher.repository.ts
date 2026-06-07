import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { VisitorVoucher, CreateVisitorVoucherDTO, UpdateVisitorVoucherDTO, VerifyVoucherDTO } from '../models/visitorVoucher.model';

export class VisitorVoucherRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { coupon_id?: string; supplementary_id?: string; verify_status?: string }): VisitorVoucher[] {
    let sql = 'SELECT * FROM visitor_vouchers WHERE 1=1';
    const params: any[] = [];

    if (filters?.coupon_id) {
      sql += ' AND coupon_id = ?';
      params.push(filters.coupon_id);
    }
    if (filters?.supplementary_id) {
      sql += ' AND supplementary_id = ?';
      params.push(filters.supplementary_id);
    }
    if (filters?.verify_status) {
      sql += ' AND verify_status = ?';
      params.push(filters.verify_status);
    }

    sql += ' ORDER BY upload_time DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as VisitorVoucher[];
  }

  findById(id: string): VisitorVoucher | undefined {
    const stmt = this.db.prepare('SELECT * FROM visitor_vouchers WHERE id = ?');
    return stmt.get(id) as VisitorVoucher | undefined;
  }

  create(dto: CreateVisitorVoucherDTO): VisitorVoucher {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO visitor_vouchers (id, supplementary_id, coupon_id, voucher_type, voucher_no, voucher_image, upload_time, uploader, verify_status, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待验证', ?, ?, ?)
    `);

    stmt.run(
      id, dto.supplementary_id || null, dto.coupon_id, dto.voucher_type,
      dto.voucher_no, dto.voucher_image || null, dto.upload_time, dto.uploader,
      dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateVisitorVoucherDTO): VisitorVoucher | undefined {
    const voucher = this.findById(id);
    if (!voucher) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.voucher_type !== undefined) { updates.push('voucher_type = ?'); params.push(dto.voucher_type); }
    if (dto.voucher_no !== undefined) { updates.push('voucher_no = ?'); params.push(dto.voucher_no); }
    if (dto.voucher_image !== undefined) { updates.push('voucher_image = ?'); params.push(dto.voucher_image); }
    if (dto.verify_status !== undefined) { updates.push('verify_status = ?'); params.push(dto.verify_status); }
    if (dto.verify_result !== undefined) { updates.push('verify_result = ?'); params.push(dto.verify_result); }
    if (dto.verify_time !== undefined) { updates.push('verify_time = ?'); params.push(dto.verify_time); }
    if (dto.verifier !== undefined) { updates.push('verifier = ?'); params.push(dto.verifier); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return voucher;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE visitor_vouchers SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  verify(id: string, dto: VerifyVoucherDTO): VisitorVoucher | undefined {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return this.update(id, {
      verify_status: dto.verify_status,
      verify_result: dto.verify_result,
      verify_time: now,
      verifier: dto.verifier
    });
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM visitor_vouchers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count(filters?: { verify_status?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM visitor_vouchers WHERE 1=1';
    const params: any[] = [];

    if (filters?.verify_status) {
      sql += ' AND verify_status = ?';
      params.push(filters.verify_status);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}
