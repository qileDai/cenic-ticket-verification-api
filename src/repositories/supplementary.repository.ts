import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { SupplementaryApplication, CreateSupplementaryDTO, UpdateSupplementaryDTO, ReviewSupplementaryDTO } from '../models/supplementary.model';

export class SupplementaryRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; applicant?: string; batch_no?: string }): SupplementaryApplication[] {
    let sql = 'SELECT * FROM supplementary_applications WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.applicant) {
      sql += ' AND applicant = ?';
      params.push(filters.applicant);
    }
    if (filters?.batch_no) {
      sql += ' AND batch_no = ?';
      params.push(filters.batch_no);
    }

    sql += ' ORDER BY apply_time DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as SupplementaryApplication[];
  }

  findById(id: string): SupplementaryApplication | undefined {
    const stmt = this.db.prepare('SELECT * FROM supplementary_applications WHERE id = ?');
    return stmt.get(id) as SupplementaryApplication | undefined;
  }

  findByVerificationId(verificationId: string): SupplementaryApplication[] {
    const stmt = this.db.prepare('SELECT * FROM supplementary_applications WHERE verification_id = ? ORDER BY apply_time DESC');
    return stmt.all(verificationId) as SupplementaryApplication[];
  }

  create(dto: CreateSupplementaryDTO): SupplementaryApplication {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO supplementary_applications (id, verification_id, coupon_id, applicant, apply_time, reason, voucher_ids, status, batch_no, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '待复核', ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.verification_id, dto.coupon_id, dto.applicant, dto.apply_time,
      dto.reason, dto.voucher_ids || null, dto.batch_no || null,
      dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateSupplementaryDTO): SupplementaryApplication | undefined {
    const supplementary = this.findById(id);
    if (!supplementary) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.voucher_ids !== undefined) { updates.push('voucher_ids = ?'); params.push(dto.voucher_ids); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.reviewer !== undefined) { updates.push('reviewer = ?'); params.push(dto.reviewer); }
    if (dto.review_time !== undefined) { updates.push('review_time = ?'); params.push(dto.review_time); }
    if (dto.review_result !== undefined) { updates.push('review_result = ?'); params.push(dto.review_result); }
    if (dto.review_comment !== undefined) { updates.push('review_comment = ?'); params.push(dto.review_comment); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return supplementary;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE supplementary_applications SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  review(id: string, dto: ReviewSupplementaryDTO): SupplementaryApplication | undefined {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return this.update(id, {
      status: dto.status,
      reviewer: dto.reviewer,
      review_time: now,
      review_comment: dto.review_comment
    });
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM supplementary_applications WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count(filters?: { status?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM supplementary_applications WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}
