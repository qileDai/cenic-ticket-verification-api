import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { AuditLog, CreateAuditLogDTO, AuditLogQuery } from '../models/auditLog.model';

export class AuditLogRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(query: AuditLogQuery): { data: AuditLog[]; total: number } {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (query.operator) {
      sql += ' AND operator = ?';
      countSql += ' AND operator = ?';
      params.push(query.operator);
      countParams.push(query.operator);
    }
    if (query.entity_type) {
      sql += ' AND entity_type = ?';
      countSql += ' AND entity_type = ?';
      params.push(query.entity_type);
      countParams.push(query.entity_type);
    }
    if (query.entity_id) {
      sql += ' AND entity_id = ?';
      countSql += ' AND entity_id = ?';
      params.push(query.entity_id);
      countParams.push(query.entity_id);
    }
    if (query.operation) {
      sql += ' AND operation = ?';
      countSql += ' AND operation = ?';
      params.push(query.operation);
      countParams.push(query.operation);
    }
    if (query.start_time) {
      sql += ' AND operate_time >= ?';
      countSql += ' AND operate_time >= ?';
      params.push(query.start_time);
      countParams.push(query.start_time);
    }
    if (query.end_time) {
      sql += ' AND operate_time <= ?';
      countSql += ' AND operate_time <= ?';
      params.push(query.end_time);
      countParams.push(query.end_time);
    }

    const countStmt = this.db.prepare(countSql);
    const countResult = countStmt.get(...countParams) as { count: number };
    const total = countResult.count;

    sql += ' ORDER BY operate_time DESC';

    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    sql += ` LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const stmt = this.db.prepare(sql);
    const data = stmt.all(...params) as AuditLog[];

    return { data, total };
  }

  findById(id: string): AuditLog | undefined {
    const stmt = this.db.prepare('SELECT * FROM audit_logs WHERE id = ?');
    return stmt.get(id) as AuditLog | undefined;
  }

  create(dto: CreateAuditLogDTO): AuditLog {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, operator, operation, entity_type, entity_id, old_value, new_value, ip_address, user_agent, operate_time, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.operator, dto.operation, dto.entity_type,
      dto.entity_id || null, dto.old_value || null, dto.new_value || null,
      dto.ip_address || null, dto.user_agent || null, now, dto.remark || null
    );

    return this.findById(id)!;
  }

  findByEntity(entityType: string, entityId: string): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY operate_time DESC
    `);
    return stmt.all(entityType, entityId) as AuditLog[];
  }

  findByOperator(operator: string, limit: number = 100): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs 
      WHERE operator = ? 
      ORDER BY operate_time DESC 
      LIMIT ?
    `);
    return stmt.all(operator, limit) as AuditLog[];
  }
}
