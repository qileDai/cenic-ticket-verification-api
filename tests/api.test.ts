import request from 'supertest';
import app from '../src/app';
import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = './data/test_scenic_ticket.db';

beforeAll(() => {
  const dbDir = './data';
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
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
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

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
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

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
  `);
  db.close();
});

afterAll(() => {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});

describe('API Root', () => {
  it('should return API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toContain('景区门票团购核销异常分诊规则计算');
  });
});

describe('Coupon API', () => {
  const testCoupon = {
    code: 'TEST-COUPON-001',
    name: '测试券码-张三',
    face_value: 100,
    purchase_price: 80,
    valid_from: '2024-01-01',
    valid_to: '2024-12-31',
    batch_no: 'BATCH-TEST-001',
    platform: '美团',
    holder_name: '张三',
    holder_phone: '13800138000'
  };

  it('should create a coupon', async () => {
    const res = await request(app)
      .post('/api/coupons')
      .send(testCoupon);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe(testCoupon.code);
  });

  it('should get all coupons', async () => {
    const res = await request(app).get('/api/coupons');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get coupon by id', async () => {
    const createRes = await request(app)
      .post('/api/coupons')
      .send({
        code: 'TEST-COUPON-002',
        name: '测试券码-李四',
        face_value: 100,
        purchase_price: 80,
        valid_from: '2024-01-01',
        valid_to: '2024-12-31',
        batch_no: 'BATCH-TEST-001',
        platform: '美团'
      });
    
    const couponId = createRes.body.data.id;
    const res = await request(app).get(`/api/coupons/${couponId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(couponId);
  });

  it('should update coupon', async () => {
    const createRes = await request(app)
      .post('/api/coupons')
      .send({
        code: 'TEST-COUPON-003',
        name: '测试券码-王五',
        face_value: 100,
        purchase_price: 80,
        valid_from: '2024-01-01',
        valid_to: '2024-12-31',
        batch_no: 'BATCH-TEST-001',
        platform: '美团'
      });
    
    const couponId = createRes.body.data.id;
    const res = await request(app)
      .put(`/api/coupons/${couponId}`)
      .send({ name: '更新后的券码名称' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('更新后的券码名称');
  });

  it('should delete coupon', async () => {
    const createRes = await request(app)
      .post('/api/coupons')
      .send({
        code: 'TEST-COUPON-004',
        name: '测试券码-赵六',
        face_value: 100,
        purchase_price: 80,
        valid_from: '2024-01-01',
        valid_to: '2024-12-31',
        batch_no: 'BATCH-TEST-001',
        platform: '美团'
      });
    
    const couponId = createRes.body.data.id;
    const res = await request(app).delete(`/api/coupons/${couponId}?operator=test`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Gate API', () => {
  const testGate = {
    gate_no: 'TEST-GATE-001',
    name: '测试闸机',
    location: '测试入口',
    ip_address: '192.168.1.200'
  };

  it('should create a gate', async () => {
    const res = await request(app)
      .post('/api/gates')
      .send(testGate);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gate_no).toBe(testGate.gate_no);
  });

  it('should get all gates', async () => {
    const res = await request(app).get('/api/gates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Verification API', () => {
  it('should check duplicate verification', async () => {
    const res = await request(app)
      .post('/api/verifications/check-duplicate')
      .send({ coupon_code: 'TEST-COUPON-001' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should import preview', async () => {
    const res = await request(app)
      .post('/api/verifications/import/preview')
      .send({
        verifications: [
          {
            coupon_code: 'TEST-COUPON-001',
            verification_time: '2024-05-25 10:00:00',
            verification_type: '闸机核销',
            operator: '测试操作员',
            batch_no: 'BATCH-TEST-001'
          }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Exception Event API', () => {
  it('should calculate suggestion', async () => {
    const res = await request(app)
      .post('/api/exception-events/suggestion')
      .send({
        coupon_id: 'test-coupon-id'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('suggestion');
  });
});

describe('Statistics API', () => {
  it('should get success rate statistics', async () => {
    const res = await request(app)
      .get('/api/statistics/success-rate?start_date=2024-01-01&end_date=2024-12-31');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get summary statistics', async () => {
    const res = await request(app)
      .get('/api/statistics/summary?start_date=2024-01-01&end_date=2024-12-31');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('period');
  });
});

describe('Audit Log API', () => {
  it('should get audit logs', async () => {
    const res = await request(app).get('/api/audit-logs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Status Flow API', () => {
  it('should get allowed transitions', async () => {
    const res = await request(app)
      .get('/api/status-flows/transitions?entity_type=coupon&current_status=未核销');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('allowed_next_statuses');
  });
});
