import Database from 'better-sqlite3';
import getDatabase from '../db';

export interface StatisticsResult {
  date: string;
  total: number;
  success: number;
  exception: number;
  supplementary: number;
  duplicate: number;
  success_rate: number;
  exception_rate: number;
  supplementary_rate: number;
  duplicate_rate: number;
}

export interface GroupedStatistics {
  group_key: string;
  total: number;
  success: number;
  exception: number;
  supplementary: number;
  duplicate: number;
  success_rate: number;
  exception_rate: number;
  supplementary_rate: number;
  duplicate_rate: number;
  details: any[];
}

export class StatisticsService {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  getSuccessRate(startDate: string, endDate: string, groupBy: string = 'day', filters?: { batch_no?: string; platform?: string }): GroupedStatistics[] {
    let groupKey = '';
    let groupSelect = '';

    switch (groupBy) {
      case 'day':
        groupKey = 'date(v.verification_time)';
        groupSelect = 'date(v.verification_time) as group_key';
        break;
      case 'batch':
        groupKey = 'v.batch_no';
        groupSelect = 'v.batch_no as group_key';
        break;
      case 'operator':
        groupKey = 'v.operator';
        groupSelect = 'v.operator as group_key';
        break;
      default:
        groupKey = 'date(v.verification_time)';
        groupSelect = 'date(v.verification_time) as group_key';
    }

    let sql = `
      SELECT 
        ${groupSelect},
        COUNT(*) as total,
        SUM(CASE WHEN v.status = '正常' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN v.status = '异常' THEN 1 ELSE 0 END) as exception,
        SUM(CASE WHEN v.status = '已补录' THEN 1 ELSE 0 END) as supplementary,
        0 as duplicate
      FROM verifications v
      WHERE date(v.verification_time) BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];

    if (filters?.batch_no) {
      sql += ' AND v.batch_no = ?';
      params.push(filters.batch_no);
    }

    if (filters?.platform) {
      sql += ' AND EXISTS (SELECT 1 FROM coupons c WHERE c.id = v.coupon_id AND c.platform = ?)';
      params.push(filters.platform);
    }

    sql += ` GROUP BY ${groupKey} ORDER BY group_key`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      group_key: row.group_key,
      total: row.total,
      success: row.success,
      exception: row.exception,
      supplementary: row.supplementary,
      duplicate: row.duplicate,
      success_rate: row.total > 0 ? Number((row.success / row.total * 100).toFixed(2)) : 0,
      exception_rate: row.total > 0 ? Number((row.exception / row.total * 100).toFixed(2)) : 0,
      supplementary_rate: row.total > 0 ? Number((row.supplementary / row.total * 100).toFixed(2)) : 0,
      duplicate_rate: row.total > 0 ? Number((row.duplicate / row.total * 100).toFixed(2)) : 0,
      details: this.getDetailsByGroup(groupBy, row.group_key, startDate, endDate)
    }));
  }

  getExceptionRate(startDate: string, endDate: string, groupBy: string = 'day', filters?: { batch_no?: string }): GroupedStatistics[] {
    let groupKey = '';
    let groupSelect = '';

    switch (groupBy) {
      case 'day':
        groupKey = 'date(e.created_at)';
        groupSelect = 'date(e.created_at) as group_key';
        break;
      case 'batch':
        groupKey = 'e.batch_no';
        groupSelect = 'e.batch_no as group_key';
        break;
      case 'operator':
        groupKey = 'e.handler';
        groupSelect = 'e.handler as group_key';
        break;
      default:
        groupKey = 'date(e.created_at)';
        groupSelect = 'date(e.created_at) as group_key';
    }

    let sql = `
      SELECT 
        ${groupSelect},
        COUNT(*) as total,
        SUM(CASE WHEN e.status = '已处理' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN e.status = '待处理' THEN 1 ELSE 0 END) as exception,
        0 as supplementary,
        0 as duplicate
      FROM exception_events e
      WHERE date(e.created_at) BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];

    if (filters?.batch_no) {
      sql += ' AND e.batch_no = ?';
      params.push(filters.batch_no);
    }

    sql += ` GROUP BY ${groupKey} ORDER BY group_key`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      group_key: row.group_key || '未分组',
      total: row.total,
      success: row.success,
      exception: row.exception,
      supplementary: row.supplementary,
      duplicate: row.duplicate,
      success_rate: row.total > 0 ? Number((row.success / row.total * 100).toFixed(2)) : 0,
      exception_rate: row.total > 0 ? Number((row.exception / row.total * 100).toFixed(2)) : 0,
      supplementary_rate: 0,
      duplicate_rate: 0,
      details: []
    }));
  }

  getDuplicateRate(startDate: string, endDate: string, groupBy: string = 'day', filters?: { batch_no?: string }): GroupedStatistics[] {
    let groupKey = '';
    let groupSelect = '';

    switch (groupBy) {
      case 'day':
        groupKey = 'date(e.created_at)';
        groupSelect = 'date(e.created_at) as group_key';
        break;
      case 'batch':
        groupKey = 'e.batch_no';
        groupSelect = 'e.batch_no as group_key';
        break;
      case 'operator':
        groupKey = 'e.handler';
        groupSelect = 'e.handler as group_key';
        break;
      default:
        groupKey = 'date(e.created_at)';
        groupSelect = 'date(e.created_at) as group_key';
    }

    let sql = `
      SELECT 
        ${groupSelect},
        COUNT(*) as total,
        0 as success,
        0 as exception,
        0 as supplementary,
        COUNT(*) as duplicate
      FROM exception_events e
      WHERE e.event_type = '重复核销' AND date(e.created_at) BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];

    if (filters?.batch_no) {
      sql += ' AND e.batch_no = ?';
      params.push(filters.batch_no);
    }

    sql += ` GROUP BY ${groupKey} ORDER BY group_key`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    const totalSql = `
      SELECT COUNT(*) as total
      FROM verifications v
      WHERE date(v.verification_time) BETWEEN ? AND ?
      ${filters?.batch_no ? ' AND v.batch_no = ?' : ''}
    `;
    const totalParams: any[] = [startDate, endDate];
    if (filters?.batch_no) totalParams.push(filters.batch_no);
    const totalStmt = this.db.prepare(totalSql);
    const totalResult = totalStmt.get(...totalParams) as { total: number };
    const overallTotal = totalResult.total;

    return rows.map(row => ({
      group_key: row.group_key || '未分组',
      total: row.total,
      success: 0,
      exception: 0,
      supplementary: 0,
      duplicate: row.duplicate,
      success_rate: 0,
      exception_rate: 0,
      supplementary_rate: 0,
      duplicate_rate: overallTotal > 0 ? Number((row.duplicate / overallTotal * 100).toFixed(2)) : 0,
      details: []
    }));
  }

  private getDetailsByGroup(groupBy: string, groupKey: string, startDate: string, endDate: string): any[] {
    let sql = '';
    const params: any[] = [];

    switch (groupBy) {
      case 'day':
        sql = `
          SELECT v.id, v.coupon_code, v.verification_time, v.status, v.operator
          FROM verifications v
          WHERE date(v.verification_time) = ?
          ORDER BY v.verification_time DESC
          LIMIT 10
        `;
        params.push(groupKey);
        break;
      case 'batch':
        sql = `
          SELECT v.id, v.coupon_code, v.verification_time, v.status, v.operator
          FROM verifications v
          WHERE v.batch_no = ?
          ORDER BY v.verification_time DESC
          LIMIT 10
        `;
        params.push(groupKey);
        break;
      case 'operator':
        sql = `
          SELECT v.id, v.coupon_code, v.verification_time, v.status, v.batch_no
          FROM verifications v
          WHERE v.operator = ? AND date(v.verification_time) BETWEEN ? AND ?
          ORDER BY v.verification_time DESC
          LIMIT 10
        `;
        params.push(groupKey, startDate, endDate);
        break;
      default:
        return [];
    }

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as any[];
  }

  getSummary(startDate: string, endDate: string): any {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM verifications WHERE date(verification_time) BETWEEN ? AND ?) as total_verifications,
        (SELECT COUNT(*) FROM verifications WHERE status = '正常' AND date(verification_time) BETWEEN ? AND ?) as success_verifications,
        (SELECT COUNT(*) FROM verifications WHERE status = '异常' AND date(verification_time) BETWEEN ? AND ?) as exception_verifications,
        (SELECT COUNT(*) FROM verifications WHERE status = '已补录' AND date(verification_time) BETWEEN ? AND ?) as supplementary_verifications,
        (SELECT COUNT(*) FROM exception_events WHERE event_type = '重复核销' AND date(created_at) BETWEEN ? AND ?) as duplicate_events,
        (SELECT COUNT(*) FROM coupons WHERE status = '已核销' AND date(updated_at) BETWEEN ? AND ?) as verified_coupons,
        (SELECT COUNT(*) FROM coupons WHERE status = '异常' AND date(updated_at) BETWEEN ? AND ?) as exception_coupons
    `;

    const stmt = this.db.prepare(sql);
    const result = stmt.get(
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate
    ) as any;

    const total = result.total_verifications || 0;
    const success = result.success_verifications || 0;
    const exception = result.exception_verifications || 0;
    const supplementary = result.supplementary_verifications || 0;
    const duplicate = result.duplicate_events || 0;

    return {
      period: { start_date: startDate, end_date: endDate },
      verifications: {
        total,
        success,
        exception,
        supplementary,
        duplicate
      },
      coupons: {
        verified: result.verified_coupons || 0,
        exception: result.exception_coupons || 0
      },
      rates: {
        success_rate: total > 0 ? Number((success / total * 100).toFixed(2)) : 0,
        exception_rate: total > 0 ? Number((exception / total * 100).toFixed(2)) : 0,
        supplementary_rate: total > 0 ? Number((supplementary / total * 100).toFixed(2)) : 0,
        duplicate_rate: total > 0 ? Number((duplicate / total * 100).toFixed(2)) : 0
      }
    };
  }
}
