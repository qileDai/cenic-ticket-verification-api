import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { ExceptionReason, CreateExceptionReasonDTO, UpdateExceptionReasonDTO } from '../models/exceptionReason.model';

export class ExceptionReasonRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; category?: string }): ExceptionReason[] {
    let sql = 'SELECT * FROM exception_reasons WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    sql += ' ORDER BY severity DESC, code';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as ExceptionReason[];
  }

  findById(id: string): ExceptionReason | undefined {
    const stmt = this.db.prepare('SELECT * FROM exception_reasons WHERE id = ?');
    return stmt.get(id) as ExceptionReason | undefined;
  }

  findByCode(code: string): ExceptionReason | undefined {
    const stmt = this.db.prepare('SELECT * FROM exception_reasons WHERE code = ?');
    return stmt.get(code) as ExceptionReason | undefined;
  }

  create(dto: CreateExceptionReasonDTO): ExceptionReason {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO exception_reasons (id, code, name, category, severity, description, solution, status, responsible_person, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '启用', ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.code, dto.name, dto.category, dto.severity || '一般',
      dto.description || null, dto.solution || null,
      dto.responsible_person || null, dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateExceptionReasonDTO): ExceptionReason | undefined {
    const reason = this.findById(id);
    if (!reason) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.name !== undefined) { updates.push('name = ?'); params.push(dto.name); }
    if (dto.category !== undefined) { updates.push('category = ?'); params.push(dto.category); }
    if (dto.severity !== undefined) { updates.push('severity = ?'); params.push(dto.severity); }
    if (dto.description !== undefined) { updates.push('description = ?'); params.push(dto.description); }
    if (dto.solution !== undefined) { updates.push('solution = ?'); params.push(dto.solution); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.responsible_person !== undefined) { updates.push('responsible_person = ?'); params.push(dto.responsible_person); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return reason;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE exception_reasons SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM exception_reasons WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count(filters?: { status?: string; category?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM exception_reasons WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}
