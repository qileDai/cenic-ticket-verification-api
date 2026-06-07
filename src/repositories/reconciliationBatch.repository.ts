import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { ReconciliationBatch, CreateReconciliationBatchDTO, UpdateReconciliationBatchDTO, ReconciliationDifference } from '../models/reconciliationBatch.model';

export class ReconciliationBatchRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; platform?: string }): ReconciliationBatch[] {
    let sql = 'SELECT * FROM reconciliation_batches WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.platform) {
      sql += ' AND platform = ?';
      params.push(filters.platform);
    }

    sql += ' ORDER BY batch_date DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as ReconciliationBatch[];
  }

  findById(id: string): ReconciliationBatch | undefined {
    const stmt = this.db.prepare('SELECT * FROM reconciliation_batches WHERE id = ?');
    return stmt.get(id) as ReconciliationBatch | undefined;
  }

  findByBatchNo(batchNo: string): ReconciliationBatch | undefined {
    const stmt = this.db.prepare('SELECT * FROM reconciliation_batches WHERE batch_no = ?');
    return stmt.get(batchNo) as ReconciliationBatch | undefined;
  }

  create(dto: CreateReconciliationBatchDTO): ReconciliationBatch {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO reconciliation_batches (id, batch_no, batch_date, platform, total_count, success_count, exception_count, supplementary_count, status, responsible_person, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, 0, 0, 0, '待对账', ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.batch_no, dto.batch_date, dto.platform,
      dto.responsible_person || null, dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateReconciliationBatchDTO): ReconciliationBatch | undefined {
    const batch = this.findById(id);
    if (!batch) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.total_count !== undefined) { updates.push('total_count = ?'); params.push(dto.total_count); }
    if (dto.success_count !== undefined) { updates.push('success_count = ?'); params.push(dto.success_count); }
    if (dto.exception_count !== undefined) { updates.push('exception_count = ?'); params.push(dto.exception_count); }
    if (dto.supplementary_count !== undefined) { updates.push('supplementary_count = ?'); params.push(dto.supplementary_count); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.start_time !== undefined) { updates.push('start_time = ?'); params.push(dto.start_time); }
    if (dto.end_time !== undefined) { updates.push('end_time = ?'); params.push(dto.end_time); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return batch;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE reconciliation_batches SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM reconciliation_batches WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  calculateDifference(batchNo: string): ReconciliationDifference | undefined {
    const batch = this.findByBatchNo(batchNo);
    if (!batch) return undefined;

    const couponStmt = this.db.prepare(`
      SELECT code FROM coupons WHERE batch_no = ?
    `);
    const coupons = couponStmt.all(batchNo) as { code: string }[];

    const verificationStmt = this.db.prepare(`
      SELECT DISTINCT coupon_code FROM verifications WHERE batch_no = ?
    `);
    const verifications = verificationStmt.all(batchNo) as { coupon_code: string }[];

    const couponCodes = new Set(coupons.map(c => c.code));
    const verificationCodes = new Set(verifications.map(v => v.coupon_code));

    const missingCoupons: string[] = [];
    const extraCoupons: string[] = [];

    for (const code of couponCodes) {
      if (!verificationCodes.has(code)) {
        missingCoupons.push(code);
      }
    }

    for (const code of verificationCodes) {
      if (!couponCodes.has(code)) {
        extraCoupons.push(code);
      }
    }

    const eventStmt = this.db.prepare(`
      SELECT event_no FROM exception_events WHERE batch_no = ?
    `);
    const events = eventStmt.all(batchNo) as { event_no: string }[];

    return {
      batch_no: batchNo,
      platform: batch.platform,
      expected_count: couponCodes.size,
      actual_count: verificationCodes.size,
      difference_count: Math.abs(couponCodes.size - verificationCodes.size),
      missing_coupons: missingCoupons,
      extra_coupons: extraCoupons,
      exception_events: events.map(e => e.event_no)
    };
  }

  count(filters?: { status?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM reconciliation_batches WHERE 1=1';
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
