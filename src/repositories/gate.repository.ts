import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { Gate, CreateGateDTO, UpdateGateDTO, GateSnapshot } from '../models/gate.model';

export class GateRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; location?: string }): Gate[] {
    let sql = 'SELECT * FROM gates WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.location) {
      sql += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }

    sql += ' ORDER BY gate_no';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as Gate[];
  }

  findById(id: string): Gate | undefined {
    const stmt = this.db.prepare('SELECT * FROM gates WHERE id = ?');
    return stmt.get(id) as Gate | undefined;
  }

  findByGateNo(gateNo: string): Gate | undefined {
    const stmt = this.db.prepare('SELECT * FROM gates WHERE gate_no = ?');
    return stmt.get(gateNo) as Gate | undefined;
  }

  create(dto: CreateGateDTO): Gate {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO gates (id, gate_no, name, location, status, ip_address, last_heartbeat, responsible_person, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, '在线', ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.gate_no, dto.name, dto.location,
      dto.ip_address || null, null, dto.responsible_person || null,
      dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateGateDTO): Gate | undefined {
    const gate = this.findById(id);
    if (!gate) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.name !== undefined) { updates.push('name = ?'); params.push(dto.name); }
    if (dto.location !== undefined) { updates.push('location = ?'); params.push(dto.location); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.ip_address !== undefined) { updates.push('ip_address = ?'); params.push(dto.ip_address); }
    if (dto.last_heartbeat !== undefined) { updates.push('last_heartbeat = ?'); params.push(dto.last_heartbeat); }
    if (dto.responsible_person !== undefined) { updates.push('responsible_person = ?'); params.push(dto.responsible_person); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return gate;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE gates SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM gates WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getSnapshot(id: string): GateSnapshot | undefined {
    const gate = this.findById(id);
    if (!gate) return undefined;

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count, MAX(verification_time) as last_time
      FROM verifications 
      WHERE gate_id = ?
    `);
    const stats = countStmt.get(id) as { count: number; last_time: string | null };

    return {
      gate,
      verification_count: stats.count,
      last_verification_time: stats.last_time || undefined,
      snapshot_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
  }

  archive(id: string): Gate | undefined {
    return this.update(id, { status: '已停用' });
  }

  count(filters?: { status?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM gates WHERE 1=1';
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
