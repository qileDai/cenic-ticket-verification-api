import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { ExceptionEvent, CreateExceptionEventDTO, UpdateExceptionEventDTO, ExceptionSuggestionInput, ExceptionSuggestionResult } from '../models/exceptionEvent.model';

export class ExceptionEventRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; event_type?: string; batch_no?: string }): ExceptionEvent[] {
    let sql = 'SELECT * FROM exception_events WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.event_type) {
      sql += ' AND event_type = ?';
      params.push(filters.event_type);
    }
    if (filters?.batch_no) {
      sql += ' AND batch_no = ?';
      params.push(filters.batch_no);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as ExceptionEvent[];
  }

  findById(id: string): ExceptionEvent | undefined {
    const stmt = this.db.prepare('SELECT * FROM exception_events WHERE id = ?');
    return stmt.get(id) as ExceptionEvent | undefined;
  }

  findByEventNo(eventNo: string): ExceptionEvent | undefined {
    const stmt = this.db.prepare('SELECT * FROM exception_events WHERE event_no = ?');
    return stmt.get(eventNo) as ExceptionEvent | undefined;
  }

  create(dto: CreateExceptionEventDTO): ExceptionEvent {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO exception_events (id, event_no, event_type, coupon_id, verification_id, gate_id, voucher_id, batch_no, severity, status, trigger_fields, threshold_value, handler, handle_deadline, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '待处理', ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.event_no, dto.event_type, dto.coupon_id || null,
      dto.verification_id || null, dto.gate_id || null, dto.voucher_id || null,
      dto.batch_no || null, dto.severity || '一般', dto.trigger_fields || null,
      dto.threshold_value || null, dto.handler || null, dto.handle_deadline || null,
      dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateExceptionEventDTO): ExceptionEvent | undefined {
    const event = this.findById(id);
    if (!event) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.handler !== undefined) { updates.push('handler = ?'); params.push(dto.handler); }
    if (dto.handle_time !== undefined) { updates.push('handle_time = ?'); params.push(dto.handle_time); }
    if (dto.handle_result !== undefined) { updates.push('handle_result = ?'); params.push(dto.handle_result); }
    if (dto.suggestion !== undefined) { updates.push('suggestion = ?'); params.push(dto.suggestion); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return event;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE exception_events SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM exception_events WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  calculateSuggestion(input: ExceptionSuggestionInput): ExceptionSuggestionResult {
    const actions: string[] = [];
    let priority: '轻微' | '一般' | '严重' | '紧急' = '一般';
    const relatedEntities: any = { vouchers: [] };

    const couponStmt = this.db.prepare('SELECT * FROM coupons WHERE id = ?');
    const coupon = couponStmt.get(input.coupon_id) as any;
    relatedEntities.coupon = input.coupon_id;

    if (coupon) {
      if (coupon.status === '异常') {
        actions.push('检查券码异常原因');
        priority = '严重';
      }
      if (coupon.status === '已过期') {
        actions.push('券码已过期，需确认是否允许入园');
        priority = '一般';
      }
    }

    if (input.verification_id) {
      relatedEntities.verification = input.verification_id;
      const verStmt = this.db.prepare('SELECT * FROM verifications WHERE id = ?');
      const verification = verStmt.get(input.verification_id) as any;

      if (verification && verification.status === '异常') {
        actions.push('核销记录异常，需人工复核');
        priority = '严重';
      }
    }

    if (input.gate_id) {
      relatedEntities.gate = input.gate_id;
      const gateStmt = this.db.prepare('SELECT * FROM gates WHERE id = ?');
      const gate = gateStmt.get(input.gate_id) as any;

      if (gate && gate.status === '离线') {
        actions.push('闸机离线，需确认核销数据同步');
        priority = '严重';
      }
    }

    if (input.voucher_ids && input.voucher_ids.length > 0) {
      relatedEntities.vouchers = input.voucher_ids;
      const voucherStmt = this.db.prepare('SELECT * FROM visitor_vouchers WHERE id = ?');

      for (const vid of input.voucher_ids) {
        const voucher = voucherStmt.get(vid) as any;
        if (voucher && voucher.verify_status === '验证失败') {
          actions.push('游客凭证验证失败，需补充材料');
          priority = '一般';
        }
      }
    }

    if (input.batch_no) {
      const batchStmt = this.db.prepare('SELECT * FROM reconciliation_batches WHERE batch_no = ?');
      const batch = batchStmt.get(input.batch_no) as any;

      if (batch && batch.status === '有差异') {
        actions.push('对账批次存在差异，需核对明细');
        priority = '紧急';
      }
    }

    if (actions.length === 0) {
      actions.push('数据正常，无需特殊处理');
    }

    const handleHours = priority === '紧急' ? 2 : priority === '严重' ? 8 : priority === '一般' ? 24 : 48;
    const estimatedTime = new Date(Date.now() + handleHours * 60 * 60 * 1000);

    return {
      suggestion: actions.join('；'),
      priority,
      actions,
      related_entities: relatedEntities,
      estimated_handle_time: estimatedTime.toISOString().replace('T', ' ').substring(0, 19)
    };
  }

  count(filters?: { status?: string; event_type?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM exception_events WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.event_type) {
      sql += ' AND event_type = ?';
      params.push(filters.event_type);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}
