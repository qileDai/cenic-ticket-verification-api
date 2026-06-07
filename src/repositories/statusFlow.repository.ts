import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { StatusFlow, CreateStatusFlowDTO, STATUS_TRANSITIONS } from '../models/statusFlow.model';

export class StatusFlowRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { entity_type?: string; entity_id?: string; operator?: string }): StatusFlow[] {
    let sql = 'SELECT * FROM status_flows WHERE 1=1';
    const params: any[] = [];

    if (filters?.entity_type) {
      sql += ' AND entity_type = ?';
      params.push(filters.entity_type);
    }
    if (filters?.entity_id) {
      sql += ' AND entity_id = ?';
      params.push(filters.entity_id);
    }
    if (filters?.operator) {
      sql += ' AND operator = ?';
      params.push(filters.operator);
    }

    sql += ' ORDER BY operate_time DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as StatusFlow[];
  }

  findById(id: string): StatusFlow | undefined {
    const stmt = this.db.prepare('SELECT * FROM status_flows WHERE id = ?');
    return stmt.get(id) as StatusFlow | undefined;
  }

  create(dto: CreateStatusFlowDTO): StatusFlow {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO status_flows (id, entity_type, entity_id, from_status, to_status, operator, operate_time, reason, remark, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.entity_type, dto.entity_id, dto.from_status || null,
      dto.to_status, dto.operator, dto.operate_time,
      dto.reason || null, dto.remark || null, now
    );

    return this.findById(id)!;
  }

  getLatestStatus(entityType: string, entityId: string): StatusFlow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM status_flows 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY operate_time DESC LIMIT 1
    `);
    return stmt.get(entityType, entityId) as StatusFlow | undefined;
  }

  canTransition(entityType: string, currentStatus: string, targetStatus: string): boolean {
    const transition = STATUS_TRANSITIONS.find(
      t => t.entity_type === entityType && t.current_status === currentStatus
    );

    if (!transition) return false;
    return transition.allowed_next_statuses.includes(targetStatus);
  }

  getTransitions(entityType: string, currentStatus: string) {
    const transition = STATUS_TRANSITIONS.find(
      t => t.entity_type === entityType && t.current_status === currentStatus
    );

    return transition || {
      entity_type: entityType,
      current_status: currentStatus,
      allowed_next_statuses: [],
      requires_reason: false
    };
  }

  requiresReason(entityType: string, currentStatus: string): boolean {
    const transition = STATUS_TRANSITIONS.find(
      t => t.entity_type === entityType && t.current_status === currentStatus
    );

    return transition?.requires_reason || false;
  }
}
