import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
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

const clearTables = db.transaction(() => {
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM status_flows;
    DELETE FROM exception_events;
    DELETE FROM visitor_vouchers;
    DELETE FROM supplementary_applications;
    DELETE FROM verifications;
    DELETE FROM reconciliation_batches;
    DELETE FROM exception_reasons;
    DELETE FROM gates;
    DELETE FROM coupons;
    DELETE FROM rule_configs;
  `);
});

const seedData = db.transaction(() => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const today = new Date().toISOString().substring(0, 10);

  const gates = [
    { id: uuidv4(), gate_no: 'GATE-001', name: '东门入口闸机A', location: '景区东门入口', status: '在线', ip_address: '192.168.1.101', responsible_person: '张伟' },
    { id: uuidv4(), gate_no: 'GATE-002', name: '东门入口闸机B', location: '景区东门入口', status: '在线', ip_address: '192.168.1.102', responsible_person: '张伟' },
    { id: uuidv4(), gate_no: 'GATE-003', name: '南门入口闸机', location: '景区南门入口', status: '离线', ip_address: '192.168.1.103', responsible_person: '李明' },
    { id: uuidv4(), gate_no: 'GATE-004', name: '西门入口闸机', location: '景区西门入口', status: '在线', ip_address: '192.168.1.104', responsible_person: '王芳' },
    { id: uuidv4(), gate_no: 'GATE-005', name: '北门入口闸机', location: '景区北门入口', status: '维护中', ip_address: '192.168.1.105', responsible_person: '赵强' }
  ];

  const gateStmt = db.prepare(`
    INSERT INTO gates (id, gate_no, name, location, status, ip_address, responsible_person, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const gate of gates) {
    gateStmt.run(gate.id, gate.gate_no, gate.name, gate.location, gate.status, gate.ip_address, gate.responsible_person, now, now);
  }

  const coupons = [
    { id: uuidv4(), code: 'MT-2024-000001', name: '美团成人票-张三', status: '已核销', face_value: 120, purchase_price: 108, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-MT-202401', platform: '美团', holder_name: '张三', holder_phone: '13800138001', responsible_person: '客服A' },
    { id: uuidv4(), code: 'MT-2024-000002', name: '美团成人票-李四', status: '已核销', face_value: 120, purchase_price: 108, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-MT-202401', platform: '美团', holder_name: '李四', holder_phone: '13800138002', responsible_person: '客服A' },
    { id: uuidv4(), code: 'MT-2024-000003', name: '美团学生票-王五', status: '未核销', face_value: 60, purchase_price: 54, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-MT-202401', platform: '美团', holder_name: '王五', holder_phone: '13800138003', responsible_person: '客服A' },
    { id: uuidv4(), code: 'MT-2024-000004', name: '美团成人票-赵六', status: '异常', face_value: 120, purchase_price: 108, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-MT-202401', platform: '美团', holder_name: '赵六', holder_phone: '13800138004', responsible_person: '客服B' },
    { id: uuidv4(), code: 'MT-2024-000005', name: '美团儿童票-孙七', status: '已过期', face_value: 60, purchase_price: 54, valid_from: '2023-01-01', valid_to: '2023-12-31', batch_no: 'BATCH-MT-202301', platform: '美团', holder_name: '孙七', holder_phone: '13800138005', responsible_person: '客服A' },
    { id: uuidv4(), code: 'DY-2024-000001', name: '抖音团购成人票-周八', status: '已核销', face_value: 100, purchase_price: 85, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-DY-202401', platform: '抖音', holder_name: '周八', holder_phone: '13800138006', responsible_person: '客服C' },
    { id: uuidv4(), code: 'DY-2024-000002', name: '抖音团购成人票-吴九', status: '已核销', face_value: 100, purchase_price: 85, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-DY-202401', platform: '抖音', holder_name: '吴九', holder_phone: '13800138007', responsible_person: '客服C' },
    { id: uuidv4(), code: 'DY-2024-000003', name: '抖音团购学生票-郑十', status: '未核销', face_value: 50, purchase_price: 42, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-DY-202401', platform: '抖音', holder_name: '郑十', holder_phone: '13800138008', responsible_person: '客服C' },
    { id: uuidv4(), code: 'TB-2024-000001', name: '淘宝团购成人票-钱一', status: '已核销', face_value: 110, purchase_price: 95, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-TB-202401', platform: '淘宝', holder_name: '钱一', holder_phone: '13800138009', responsible_person: '客服D' },
    { id: uuidv4(), code: 'TB-2024-000002', name: '淘宝团购成人票-孙二', status: '异常', face_value: 110, purchase_price: 95, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-TB-202401', platform: '淘宝', holder_name: '孙二', holder_phone: '13800138010', responsible_person: '客服D' },
    { id: uuidv4(), code: 'TB-2024-000003', name: '淘宝团购儿童票-李三', status: '未核销', face_value: 55, purchase_price: 48, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-TB-202401', platform: '淘宝', holder_name: '李三', holder_phone: '13800138011', responsible_person: '客服D' },
    { id: uuidv4(), code: 'PT-2024-000001', name: '携程团购成人票-周五', status: '已核销', face_value: 115, purchase_price: 100, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-PT-202401', platform: '携程', holder_name: '周五', holder_phone: '13800138012', responsible_person: '客服E' },
    { id: uuidv4(), code: 'PT-2024-000002', name: '携程团购成人票-吴六', status: '已作废', face_value: 115, purchase_price: 100, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-PT-202401', platform: '携程', holder_name: '吴六', holder_phone: '13800138013', responsible_person: '客服E' },
    { id: uuidv4(), code: 'PT-2024-000003', name: '携程团购学生票-郑七', status: '未核销', face_value: 58, purchase_price: 50, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-PT-202401', platform: '携程', holder_name: '郑七', holder_phone: '13800138014', responsible_person: '客服E' },
    { id: uuidv4(), code: 'MT-2024-000006', name: '美团成人票-王八', status: '已核销', face_value: 120, purchase_price: 108, valid_from: '2024-01-01', valid_to: '2024-12-31', batch_no: 'BATCH-MT-202402', platform: '美团', holder_name: '王八', holder_phone: '13800138015', responsible_person: '客服A' }
  ];

  const couponStmt = db.prepare(`
    INSERT INTO coupons (id, code, name, status, face_value, purchase_price, valid_from, valid_to, batch_no, platform, holder_name, holder_phone, responsible_person, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const coupon of coupons) {
    couponStmt.run(coupon.id, coupon.code, coupon.name, coupon.status, coupon.face_value, coupon.purchase_price, coupon.valid_from, coupon.valid_to, coupon.batch_no, coupon.platform, coupon.holder_name, coupon.holder_phone, coupon.responsible_person, now, now);
  }

  const verifications = [
    { id: uuidv4(), coupon_id: coupons[0].id, coupon_code: coupons[0].code, gate_id: gates[0].id, verification_time: `${today} 09:15:23`, verification_type: '闸机核销', status: '正常', operator: '闸机系统', device_no: 'DEV-001', batch_no: 'BATCH-MT-202401' },
    { id: uuidv4(), coupon_id: coupons[1].id, coupon_code: coupons[1].code, gate_id: gates[1].id, verification_time: `${today} 09:32:45`, verification_type: '闸机核销', status: '正常', operator: '闸机系统', device_no: 'DEV-002', batch_no: 'BATCH-MT-202401' },
    { id: uuidv4(), coupon_id: coupons[3].id, coupon_code: coupons[3].code, gate_id: gates[2].id, verification_time: `${today} 10:05:12`, verification_type: '闸机核销', status: '异常', operator: '闸机系统', device_no: 'DEV-003', batch_no: 'BATCH-MT-202401', exception_reason: '闸机离线导致数据同步失败' },
    { id: uuidv4(), coupon_id: coupons[5].id, coupon_code: coupons[5].code, gate_id: gates[0].id, verification_time: `${today} 10:28:33`, verification_type: '闸机核销', status: '正常', operator: '闸机系统', device_no: 'DEV-001', batch_no: 'BATCH-DY-202401' },
    { id: uuidv4(), coupon_id: coupons[6].id, coupon_code: coupons[6].code, gate_id: gates[1].id, verification_time: `${today} 10:45:56`, verification_type: '闸机核销', status: '正常', operator: '闸机系统', device_no: 'DEV-002', batch_no: 'BATCH-DY-202401' },
    { id: uuidv4(), coupon_id: coupons[8].id, coupon_code: coupons[8].code, gate_id: gates[3].id, verification_time: `${today} 11:12:21`, verification_type: '闸机核销', status: '正常', operator: '闸机系统', device_no: 'DEV-004', batch_no: 'BATCH-TB-202401' },
    { id: uuidv4(), coupon_id: coupons[9].id, coupon_code: coupons[9].code, gate_id: gates[3].id, verification_time: `${today} 11:35:44`, verification_type: '闸机核销', status: '异常', operator: '闸机系统', device_no: 'DEV-004', batch_no: 'BATCH-TB-202401', exception_reason: '券码状态异常' },
    { id: uuidv4(), coupon_id: coupons[11].id, coupon_code: coupons[11].code, gate_id: gates[0].id, verification_time: `${today} 13:22:15`, verification_type: '闸机核销', status: '正常', operator: '闸机系统', device_no: 'DEV-001', batch_no: 'BATCH-PT-202401' },
    { id: uuidv4(), coupon_id: coupons[14].id, coupon_code: coupons[14].code, gate_id: gates[1].id, verification_time: `${today} 14:05:38`, verification_type: '闸机核销', status: '正常', operator: '闸机系统', device_no: 'DEV-002', batch_no: 'BATCH-MT-202402' },
    { id: uuidv4(), coupon_id: coupons[0].id, coupon_code: coupons[0].code, gate_id: gates[0].id, verification_time: `${today} 15:30:00`, verification_type: '人工核销', status: '异常', operator: '人工窗口A', batch_no: 'BATCH-MT-202401', exception_reason: '重复核销' }
  ];

  const verificationStmt = db.prepare(`
    INSERT INTO verifications (id, coupon_id, coupon_code, gate_id, verification_time, verification_type, status, operator, device_no, batch_no, exception_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const v of verifications) {
    verificationStmt.run(v.id, v.coupon_id, v.coupon_code, v.gate_id, v.verification_time, v.verification_type, v.status, v.operator, v.device_no, v.batch_no, v.exception_reason || null, now, now);
  }

  const exceptionReasons = [
    { id: uuidv4(), code: 'EXC-001', name: '闸机离线', category: '设备故障', severity: '严重', description: '闸机设备离线导致数据无法同步', solution: '检查网络连接，重启闸机设备', responsible_person: '技术部' },
    { id: uuidv4(), code: 'EXC-002', name: '重复核销', category: '业务异常', severity: '严重', description: '同一券码被多次核销', solution: '核实核销记录，进行异常处理', responsible_person: '客服部' },
    { id: uuidv4(), code: 'EXC-003', name: '券码过期', category: '业务异常', severity: '一般', description: '券码已超过有效期', solution: '引导游客重新购票或申请延期', responsible_person: '客服部' },
    { id: uuidv4(), code: 'EXC-004', name: '券码作废', category: '业务异常', severity: '一般', description: '券码已被作废', solution: '核实作废原因，提供解决方案', responsible_person: '客服部' },
    { id: uuidv4(), code: 'EXC-005', name: '凭证缺失', category: '资料异常', severity: '一般', description: '游客凭证材料缺失', solution: '要求游客补充凭证材料', responsible_person: '客服部' }
  ];

  const reasonStmt = db.prepare(`
    INSERT INTO exception_reasons (id, code, name, category, severity, description, solution, status, responsible_person, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, '启用', ?, ?, ?)
  `);

  for (const reason of exceptionReasons) {
    reasonStmt.run(reason.id, reason.code, reason.name, reason.category, reason.severity, reason.description, reason.solution, reason.responsible_person, now, now);
  }

  const supplementaryApplications = [
    { id: uuidv4(), verification_id: verifications[2].id, coupon_id: coupons[3].id, applicant: '客服A', apply_time: `${today} 10:30:00`, reason: '闸机离线导致核销记录未同步，需要补录', status: '待复核', batch_no: 'BATCH-MT-202401' },
    { id: uuidv4(), verification_id: verifications[6].id, coupon_id: coupons[9].id, applicant: '客服D', apply_time: `${today} 11:45:00`, reason: '券码状态异常，需要人工复核', status: '待补充', batch_no: 'BATCH-TB-202401' },
    { id: uuidv4(), verification_id: verifications[9].id, coupon_id: coupons[0].id, applicant: '人工窗口A', apply_time: `${today} 15:45:00`, reason: '重复核销异常，需要处理', status: '已确认', reviewer: '主管张伟', review_time: `${today} 16:00:00`, review_result: '确认异常，已处理', batch_no: 'BATCH-MT-202401' },
    { id: uuidv4(), verification_id: verifications[2].id, coupon_id: coupons[3].id, applicant: '客服B', apply_time: `${today} 09:00:00`, reason: '测试补录申请', status: '已驳回', reviewer: '主管李明', review_time: `${today} 09:30:00`, review_result: '资料不全，驳回', review_comment: '缺少游客凭证', batch_no: 'BATCH-MT-202401' },
    { id: uuidv4(), verification_id: verifications[6].id, coupon_id: coupons[9].id, applicant: '客服C', apply_time: `${today} 08:00:00`, reason: '已完成归档的补录', status: '已归档', reviewer: '主管王芳', review_time: `${today} 08:30:00`, review_result: '审核通过', batch_no: 'BATCH-TB-202401' }
  ];

  const supplementaryStmt = db.prepare(`
    INSERT INTO supplementary_applications (id, verification_id, coupon_id, applicant, apply_time, reason, status, reviewer, review_time, review_result, review_comment, batch_no, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of supplementaryApplications) {
    supplementaryStmt.run(s.id, s.verification_id, s.coupon_id, s.applicant, s.apply_time, s.reason, s.status, s.reviewer || null, s.review_time || null, s.review_result || null, s.review_comment || null, s.batch_no, now, now);
  }

  const visitorVouchers = [
    { id: uuidv4(), supplementary_id: supplementaryApplications[0].id, coupon_id: coupons[3].id, voucher_type: '身份证照片', voucher_no: 'VCH-2024-000001', upload_time: `${today} 10:35:00`, uploader: '客服A', verify_status: '验证通过', verifier: '审核员甲', verify_time: `${today} 10:40:00` },
    { id: uuidv4(), supplementary_id: supplementaryApplications[0].id, coupon_id: coupons[3].id, voucher_type: '订单截图', voucher_no: 'VCH-2024-000002', upload_time: `${today} 10:36:00`, uploader: '客服A', verify_status: '验证通过', verifier: '审核员甲', verify_time: `${today} 10:41:00` },
    { id: uuidv4(), supplementary_id: supplementaryApplications[1].id, coupon_id: coupons[9].id, voucher_type: '身份证照片', voucher_no: 'VCH-2024-000003', upload_time: `${today} 11:50:00`, uploader: '客服D', verify_status: '待验证' },
    { id: uuidv4(), supplementary_id: supplementaryApplications[3].id, coupon_id: coupons[3].id, voucher_type: '订单截图', voucher_no: 'VCH-2024-000004', upload_time: `${today} 09:15:00`, uploader: '客服B', verify_status: '验证失败', verifier: '审核员乙', verify_time: `${today} 09:20:00`, verify_result: '图片模糊，无法识别' },
    { id: uuidv4(), supplementary_id: null, coupon_id: coupons[2].id, voucher_type: '学生证照片', voucher_no: 'VCH-2024-000005', upload_time: `${today} 14:00:00`, uploader: '游客王五', verify_status: '待验证' }
  ];

  const voucherStmt = db.prepare(`
    INSERT INTO visitor_vouchers (id, supplementary_id, coupon_id, voucher_type, voucher_no, upload_time, uploader, verify_status, verify_result, verify_time, verifier, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const v of visitorVouchers) {
    voucherStmt.run(v.id, v.supplementary_id || null, v.coupon_id, v.voucher_type, v.voucher_no, v.upload_time, v.uploader, v.verify_status, v.verify_result || null, v.verify_time || null, v.verifier || null, now, now);
  }

  const reconciliationBatches = [
    { id: uuidv4(), batch_no: 'BATCH-MT-202401', batch_date: today, platform: '美团', total_count: 5, success_count: 3, exception_count: 2, supplementary_count: 1, status: '已完成', responsible_person: '财务A', start_time: `${today} 08:00:00`, end_time: `${today} 18:00:00` },
    { id: uuidv4(), batch_no: 'BATCH-DY-202401', batch_date: today, platform: '抖音', total_count: 3, success_count: 2, exception_count: 0, supplementary_count: 0, status: '已完成', responsible_person: '财务B', start_time: `${today} 08:00:00`, end_time: `${today} 18:00:00` },
    { id: uuidv4(), batch_no: 'BATCH-TB-202401', batch_date: today, platform: '淘宝', total_count: 3, success_count: 1, exception_count: 2, supplementary_count: 1, status: '有差异', responsible_person: '财务C', start_time: `${today} 08:00:00`, end_time: `${today} 18:00:00` },
    { id: uuidv4(), batch_no: 'BATCH-PT-202401', batch_date: today, platform: '携程', total_count: 3, success_count: 1, exception_count: 1, supplementary_count: 0, status: '对账中', responsible_person: '财务D', start_time: `${today} 08:00:00` },
    { id: uuidv4(), batch_no: 'BATCH-MT-202402', batch_date: today, platform: '美团', total_count: 1, success_count: 1, exception_count: 0, supplementary_count: 0, status: '待对账', responsible_person: '财务A' }
  ];

  const batchStmt = db.prepare(`
    INSERT INTO reconciliation_batches (id, batch_no, batch_date, platform, total_count, success_count, exception_count, supplementary_count, status, responsible_person, start_time, end_time, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const b of reconciliationBatches) {
    batchStmt.run(b.id, b.batch_no, b.batch_date, b.platform, b.total_count, b.success_count, b.exception_count, b.supplementary_count, b.status, b.responsible_person, b.start_time || null, b.end_time || null, now, now);
  }

  const exceptionEvents = [
    { id: uuidv4(), event_no: 'EXC-EVT-2024-000001', event_type: '重复核销', coupon_id: coupons[0].id, verification_id: verifications[9].id, gate_id: gates[0].id, batch_no: 'BATCH-MT-202401', severity: '严重', status: '已处理', handler: '主管张伟', handle_time: `${today} 16:30:00`, handle_result: '已核实并处理，数据已修正', trigger_fields: JSON.stringify({ coupon_code: coupons[0].code }), threshold_value: 1 },
    { id: uuidv4(), event_no: 'EXC-EVT-2024-000002', event_type: '闸机离线', coupon_id: coupons[3].id, verification_id: verifications[2].id, gate_id: gates[2].id, batch_no: 'BATCH-MT-202401', severity: '严重', status: '处理中', handler: '技术部张伟', handle_deadline: `${today} 18:00:00`, trigger_fields: JSON.stringify({ gate_no: 'GATE-003' }) },
    { id: uuidv4(), event_no: 'EXC-EVT-2024-000003', event_type: '券码异常', coupon_id: coupons[9].id, verification_id: verifications[6].id, gate_id: gates[3].id, batch_no: 'BATCH-TB-202401', severity: '一般', status: '待处理', trigger_fields: JSON.stringify({ coupon_status: '异常' }) },
    { id: uuidv4(), event_no: 'EXC-EVT-2024-000004', event_type: '凭证缺失', coupon_id: coupons[3].id, voucher_id: visitorVoucher[3].id, batch_no: 'BATCH-MT-202401', severity: '一般', status: '已驳回', handler: '审核员乙', handle_time: `${today} 09:25:00`, handle_result: '凭证验证失败，需要重新上传', trigger_fields: JSON.stringify({ verify_status: '验证失败' }) },
    { id: uuidv4(), event_no: 'EXC-EVT-2024-000005', event_type: '闸机维护', gate_id: gates[4].id, batch_no: null, severity: '轻微', status: '已处理', handler: '维护部赵强', handle_time: `${today} 10:00:00`, handle_result: '闸机已进入维护模式', trigger_fields: JSON.stringify({ gate_status: '维护中' }) }
  ];

  const eventStmt = db.prepare(`
    INSERT INTO exception_events (id, event_no, event_type, coupon_id, verification_id, gate_id, voucher_id, batch_no, severity, status, trigger_fields, threshold_value, handler, handle_deadline, handle_time, handle_result, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const e of exceptionEvents) {
    eventStmt.run(e.id, e.event_no, e.event_type, e.coupon_id || null, e.verification_id || null, e.gate_id || null, e.voucher_id || null, e.batch_no || null, e.severity, e.status, e.trigger_fields || null, e.threshold_value || null, e.handler || null, e.handle_deadline || null, e.handle_time || null, e.handle_result || null, now, now);
  }

  const ruleConfigs = [
    { id: uuidv4(), rule_code: 'DUPLICATE_THRESHOLD', rule_name: '重复核销阈值', rule_type: '阈值配置', rule_value: '1', description: '同一券码核销次数超过此值即触发异常', threshold: 1, unit: '次', responsible_person: '运营部' },
    { id: uuidv4(), rule_code: 'GATE_OFFLINE_THRESHOLD', rule_name: '闸机离线阈值', rule_type: '阈值配置', rule_value: '30', description: '闸机离线超过此分钟数即触发异常', threshold: 30, unit: '分钟', responsible_person: '技术部' },
    { id: uuidv4(), rule_code: 'HANDLE_DEADLINE_HOURS', rule_name: '处理时限', rule_type: '时限配置', rule_value: '24', description: '异常事件处理时限', threshold: 24, unit: '小时', responsible_person: '运营部' },
    { id: uuidv4(), rule_code: 'SUPPLEMENTARY_EXPIRE_DAYS', rule_name: '补录申请有效期', rule_type: '时限配置', rule_value: '7', description: '补录申请必须在有效期内完成', threshold: 7, unit: '天', responsible_person: '客服部' },
    { id: uuidv4(), rule_code: 'VOUCHER_VERIFY_TIMEOUT', rule_name: '凭证验证超时', rule_type: '时限配置', rule_value: '48', description: '凭证上传后必须在此时限内完成验证', threshold: 48, unit: '小时', responsible_person: '客服部' }
  ];

  const ruleStmt = db.prepare(`
    INSERT INTO rule_configs (id, rule_code, rule_name, rule_type, rule_value, description, threshold, unit, status, responsible_person, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '启用', ?, ?, ?)
  `);

  for (const r of ruleConfigs) {
    ruleStmt.run(r.id, r.rule_code, r.rule_name, r.rule_type, r.rule_value, r.description, r.threshold, r.unit, r.responsible_person, now, now);
  }

  const statusFlows = [
    { id: uuidv4(), entity_type: 'coupon', entity_id: coupons[0].id, from_status: '未核销', to_status: '已核销', operator: '闸机系统', operate_time: `${today} 09:15:23` },
    { id: uuidv4(), entity_type: 'coupon', entity_id: coupons[0].id, from_status: '已核销', to_status: '异常', operator: '主管张伟', operate_time: `${today} 16:00:00`, reason: '重复核销异常' },
    { id: uuidv4(), entity_type: 'supplementary', entity_id: supplementaryApplications[2].id, from_status: '待复核', to_status: '已确认', operator: '主管张伟', operate_time: `${today} 16:00:00` },
    { id: uuidv4(), entity_type: 'supplementary', entity_id: supplementaryApplications[3].id, from_status: '待复核', to_status: '已驳回', operator: '主管李明', operate_time: `${today} 09:30:00`, reason: '缺少游客凭证' },
    { id: uuidv4(), entity_type: 'exception_event', entity_id: exceptionEvents[0].id, from_status: '待处理', to_status: '已处理', operator: '主管张伟', operate_time: `${today} 16:30:00` }
  ];

  const flowStmt = db.prepare(`
    INSERT INTO status_flows (id, entity_type, entity_id, from_status, to_status, operator, operate_time, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const f of statusFlows) {
    flowStmt.run(f.id, f.entity_type, f.entity_id, f.from_status || null, f.to_status, f.operator, f.operate_time, f.reason || null, now);
  }

  const auditLogs = [
    { id: uuidv4(), operator: '闸机系统', operation: '核销', entity_type: 'verification', entity_id: verifications[0].id, operate_time: `${today} 09:15:23` },
    { id: uuidv4(), operator: '闸机系统', operation: '核销', entity_type: 'verification', entity_id: verifications[1].id, operate_time: `${today} 09:32:45` },
    { id: uuidv4(), operator: '主管张伟', operation: '处理异常', entity_type: 'exception_event', entity_id: exceptionEvents[0].id, operate_time: `${today} 16:30:00` },
    { id: uuidv4(), operator: '客服A', operation: '创建补录申请', entity_type: 'supplementary', entity_id: supplementaryApplications[0].id, operate_time: `${today} 10:30:00` },
    { id: uuidv4(), operator: '审核员甲', operation: '验证凭证', entity_type: 'visitor_voucher', entity_id: visitorVoucher[0].id, operate_time: `${today} 10:40:00` }
  ];

  const auditStmt = db.prepare(`
    INSERT INTO audit_logs (id, operator, operation, entity_type, entity_id, operate_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of auditLogs) {
    auditStmt.run(a.id, a.operator, a.operation, a.entity_type, a.entity_id || null, a.operate_time, now);
  }

  console.log('✅ Seed数据插入成功');
  console.log(`📊 数据统计:`);
  console.log(`   - 闸机: ${gates.length} 条`);
  console.log(`   - 券码: ${coupons.length} 条`);
  console.log(`   - 核销记录: ${verifications.length} 条`);
  console.log(`   - 异常原因: ${exceptionReasons.length} 条`);
  console.log(`   - 补录申请: ${supplementaryApplications.length} 条`);
  console.log(`   - 游客凭证: ${visitorVoucher.length} 条`);
  console.log(`   - 对账批次: ${reconciliationBatches.length} 条`);
  console.log(`   - 异常事件: ${exceptionEvents.length} 条`);
  console.log(`   - 规则配置: ${ruleConfigs.length} 条`);
  console.log(`   - 状态流转: ${statusFlows.length} 条`);
  console.log(`   - 审计日志: ${auditLogs.length} 条`);
  console.log(`   总计: ${gates.length + coupons.length + verifications.length + exceptionReasons.length + supplementaryApplications.length + visitorVoucher.length + reconciliationBatches.length + exceptionEvents.length + ruleConfigs.length + statusFlows.length + auditLogs.length} 条`);
});

try {
  clearTables();
  seedData();
  console.log('✅ 数据库初始化和Seed数据完成');
} catch (error) {
  console.error('❌ Seed数据插入失败:', error);
  process.exit(1);
} finally {
  db.close();
}
