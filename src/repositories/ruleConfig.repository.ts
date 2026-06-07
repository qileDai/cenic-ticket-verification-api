import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { RuleConfig, CreateRuleConfigDTO, UpdateRuleConfigDTO } from '../models/ruleConfig.model';

export class RuleConfigRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; rule_type?: string }): RuleConfig[] {
    let sql = 'SELECT * FROM rule_configs WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.rule_type) {
      sql += ' AND rule_type = ?';
      params.push(filters.rule_type);
    }

    sql += ' ORDER BY rule_code';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as RuleConfig[];
  }

  findById(id: string): RuleConfig | undefined {
    const stmt = this.db.prepare('SELECT * FROM rule_configs WHERE id = ?');
    return stmt.get(id) as RuleConfig | undefined;
  }

  findByRuleCode(ruleCode: string): RuleConfig | undefined {
    const stmt = this.db.prepare('SELECT * FROM rule_configs WHERE rule_code = ?');
    return stmt.get(ruleCode) as RuleConfig | undefined;
  }

  create(dto: CreateRuleConfigDTO): RuleConfig {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO rule_configs (id, rule_code, rule_name, rule_type, rule_value, description, threshold, unit, status, responsible_person, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '启用', ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.rule_code, dto.rule_name, dto.rule_type, dto.rule_value,
      dto.description || null, dto.threshold || null, dto.unit || null,
      dto.responsible_person || null, dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateRuleConfigDTO): RuleConfig | undefined {
    const config = this.findById(id);
    if (!config) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.rule_name !== undefined) { updates.push('rule_name = ?'); params.push(dto.rule_name); }
    if (dto.rule_value !== undefined) { updates.push('rule_value = ?'); params.push(dto.rule_value); }
    if (dto.description !== undefined) { updates.push('description = ?'); params.push(dto.description); }
    if (dto.threshold !== undefined) { updates.push('threshold = ?'); params.push(dto.threshold); }
    if (dto.unit !== undefined) { updates.push('unit = ?'); params.push(dto.unit); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.responsible_person !== undefined) { updates.push('responsible_person = ?'); params.push(dto.responsible_person); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return config;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE rule_configs SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM rule_configs WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getValue(ruleCode: string): string | undefined {
    const config = this.findByRuleCode(ruleCode);
    return config?.status === '启用' ? config.rule_value : undefined;
  }

  getThreshold(ruleCode: string): number | undefined {
    const config = this.findByRuleCode(ruleCode);
    return config?.status === '启用' ? config.threshold : undefined;
  }
}
