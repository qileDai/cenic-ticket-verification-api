import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || './data/scenic_ticket.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createTables = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '未核销',
      face_value REAL NOT NULL,
      purchase_price REAL NOT NULL,
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      platform TEXT NOT NULL,
      holder_name TEXT,
      holder_phone TEXT,
      holder_id_card TEXT,
      responsible_person TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
    CREATE INDEX IF NOT EXISTS idx_coupons_batch_no ON coupons(batch_no);

    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      coupon_id TEXT NOT NULL,
      coupon_code TEXT NOT NULL,
      gate_id TEXT,
      verification_time TEXT NOT NULL,
      verification_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '正常',
      operator TEXT NOT NULL,
      device_no TEXT,
      batch_no TEXT NOT NULL,
      exception_reason TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE INDEX IF NOT EXISTS idx_verifications_coupon_id ON verifications(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);
    CREATE INDEX IF NOT EXISTS idx_verifications_batch_no ON verifications(batch_no);

    CREATE TABLE IF NOT EXISTS gates (
      id TEXT PRIMARY KEY,
      gate_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '在线',
      ip_address TEXT,
      last_heartbeat TEXT,
      responsible_person TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_gates_status ON gates(status);

    CREATE TABLE IF NOT EXISTS exception_reasons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT '一般',
      description TEXT,
      solution TEXT,
      status TEXT NOT NULL DEFAULT '启用',
      responsible_person TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_exception_reasons_category ON exception_reasons(category);
    CREATE INDEX IF NOT EXISTS idx_exception_reasons_status ON exception_reasons(status);

    CREATE TABLE IF NOT EXISTS supplementary_applications (
      id TEXT PRIMARY KEY,
      verification_id TEXT NOT NULL,
      coupon_id TEXT NOT NULL,
      applicant TEXT NOT NULL,
      apply_time TEXT NOT NULL,
      reason TEXT NOT NULL,
      voucher_ids TEXT,
      status TEXT NOT NULL DEFAULT '待复核',
      reviewer TEXT,
      review_time TEXT,
      review_result TEXT,
      review_comment TEXT,
      batch_no TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (verification_id) REFERENCES verifications(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE INDEX IF NOT EXISTS idx_supplementary_status ON supplementary_applications(status);
    CREATE INDEX IF NOT EXISTS idx_supplementary_batch_no ON supplementary_applications(batch_no);

    CREATE TABLE IF NOT EXISTS visitor_vouchers (
      id TEXT PRIMARY KEY,
      supplementary_id TEXT,
      coupon_id TEXT NOT NULL,
      voucher_type TEXT NOT NULL,
      voucher_no TEXT NOT NULL,
      voucher_image TEXT,
      upload_time TEXT NOT NULL,
      uploader TEXT NOT NULL,
      verify_status TEXT NOT NULL DEFAULT '待验证',
      verify_result TEXT,
      verify_time TEXT,
      verifier TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (supplementary_id) REFERENCES supplementary_applications(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE INDEX IF NOT EXISTS idx_visitor_vouchers_coupon_id ON visitor_vouchers(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_visitor_vouchers_verify_status ON visitor_vouchers(verify_status);

    CREATE TABLE IF NOT EXISTS reconciliation_batches (
      id TEXT PRIMARY KEY,
      batch_no TEXT UNIQUE NOT NULL,
      batch_date TEXT NOT NULL,
      platform TEXT NOT NULL,
      total_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      exception_count INTEGER NOT NULL DEFAULT 0,
      supplementary_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '待对账',
      responsible_person TEXT,
      start_time TEXT,
      end_time TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_reconciliation_batches_status ON reconciliation_batches(status);
    CREATE INDEX IF NOT EXISTS idx_reconciliation_batches_batch_date ON reconciliation_batches(batch_date);

    CREATE TABLE IF NOT EXISTS status_flows (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator TEXT NOT NULL,
      operate_time TEXT NOT NULL,
      reason TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_status_flows_entity ON status_flows(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_status_flows_operator ON status_flows(operator);

    CREATE TABLE IF NOT EXISTS rule_configs (
      id TEXT PRIMARY KEY,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      rule_value TEXT NOT NULL,
      description TEXT,
      threshold REAL,
      unit TEXT,
      status TEXT NOT NULL DEFAULT '启用',
      responsible_person TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_rule_configs_rule_type ON rule_configs(rule_type);
    CREATE INDEX IF NOT EXISTS idx_rule_configs_status ON rule_configs(status);

    CREATE TABLE IF NOT EXISTS exception_events (
      id TEXT PRIMARY KEY,
      event_no TEXT UNIQUE NOT NULL,
      event_type TEXT NOT NULL,
      coupon_id TEXT,
      verification_id TEXT,
      gate_id TEXT,
      voucher_id TEXT,
      batch_no TEXT,
      severity TEXT NOT NULL DEFAULT '一般',
      status TEXT NOT NULL DEFAULT '待处理',
      trigger_fields TEXT,
      threshold_value REAL,
      handler TEXT,
      handle_deadline TEXT,
      handle_time TEXT,
      handle_result TEXT,
      suggestion TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id),
      FOREIGN KEY (verification_id) REFERENCES verifications(id),
      FOREIGN KEY (gate_id) REFERENCES gates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_exception_events_status ON exception_events(status);
    CREATE INDEX IF NOT EXISTS idx_exception_events_event_type ON exception_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_exception_events_batch_no ON exception_events(batch_no);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      operator TEXT NOT NULL,
      operation TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      operate_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      remark TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_operate_time ON audit_logs(operate_time);
  `);
});

try {
  createTables();
  console.log('✅ 数据库表创建成功');
  console.log(`📍 数据库位置: ${dbPath}`);
} catch (error) {
  console.error('❌ 数据库表创建失败:', error);
  process.exit(1);
} finally {
  db.close();
}
