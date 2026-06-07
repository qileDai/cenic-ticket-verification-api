import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../db';
import { Coupon, CreateCouponDTO, UpdateCouponDTO } from '../models/coupon.model';

export class CouponRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  findAll(filters?: { status?: string; batch_no?: string; platform?: string; holder_phone?: string }): Coupon[] {
    let sql = 'SELECT * FROM coupons WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.batch_no) {
      sql += ' AND batch_no = ?';
      params.push(filters.batch_no);
    }
    if (filters?.platform) {
      sql += ' AND platform = ?';
      params.push(filters.platform);
    }
    if (filters?.holder_phone) {
      sql += ' AND holder_phone = ?';
      params.push(filters.holder_phone);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as Coupon[];
  }

  findById(id: string): Coupon | undefined {
    const stmt = this.db.prepare('SELECT * FROM coupons WHERE id = ?');
    return stmt.get(id) as Coupon | undefined;
  }

  findByCode(code: string): Coupon | undefined {
    const stmt = this.db.prepare('SELECT * FROM coupons WHERE code = ?');
    return stmt.get(code) as Coupon | undefined;
  }

  create(dto: CreateCouponDTO): Coupon {
    const id = uuidv4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = this.db.prepare(`
      INSERT INTO coupons (id, code, name, status, face_value, purchase_price, valid_from, valid_to, 
        batch_no, platform, holder_name, holder_phone, holder_id_card, responsible_person, remark, created_at, updated_at)
      VALUES (?, ?, ?, '未核销', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, dto.code, dto.name, dto.face_value, dto.purchase_price,
      dto.valid_from, dto.valid_to, dto.batch_no, dto.platform,
      dto.holder_name || null, dto.holder_phone || null, dto.holder_id_card || null,
      dto.responsible_person || null, dto.remark || null, now, now
    );

    return this.findById(id)!;
  }

  update(id: string, dto: UpdateCouponDTO): Coupon | undefined {
    const coupon = this.findById(id);
    if (!coupon) return undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.name !== undefined) { updates.push('name = ?'); params.push(dto.name); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.face_value !== undefined) { updates.push('face_value = ?'); params.push(dto.face_value); }
    if (dto.purchase_price !== undefined) { updates.push('purchase_price = ?'); params.push(dto.purchase_price); }
    if (dto.valid_from !== undefined) { updates.push('valid_from = ?'); params.push(dto.valid_from); }
    if (dto.valid_to !== undefined) { updates.push('valid_to = ?'); params.push(dto.valid_to); }
    if (dto.holder_name !== undefined) { updates.push('holder_name = ?'); params.push(dto.holder_name); }
    if (dto.holder_phone !== undefined) { updates.push('holder_phone = ?'); params.push(dto.holder_phone); }
    if (dto.holder_id_card !== undefined) { updates.push('holder_id_card = ?'); params.push(dto.holder_id_card); }
    if (dto.responsible_person !== undefined) { updates.push('responsible_person = ?'); params.push(dto.responsible_person); }
    if (dto.remark !== undefined) { updates.push('remark = ?'); params.push(dto.remark); }

    if (updates.length === 0) return coupon;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString().replace('T', ' ').substring(0, 19));
    params.push(id);

    const stmt = this.db.prepare(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM coupons WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count(filters?: { status?: string; batch_no?: string }): number {
    let sql = 'SELECT COUNT(*) as count FROM coupons WHERE 1=1';
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
