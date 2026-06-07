import express, { Express, Request, Response, NextFunction } from 'express';
import { config } from './config';

import couponRouter from './routers/coupon.router';
import verificationRouter from './routers/verification.router';
import gateRouter from './routers/gate.router';
import exceptionReasonRouter from './routers/exceptionReason.router';
import supplementaryRouter from './routers/supplementary.router';
import visitorVoucherRouter from './routers/visitorVoucher.router';
import reconciliationBatchRouter from './routers/reconciliationBatch.router';
import statusFlowRouter from './routers/statusFlow.router';
import ruleConfigRouter from './routers/ruleConfig.router';
import exceptionEventRouter from './routers/exceptionEvent.router';
import auditLogRouter from './routers/auditLog.router';
import statisticsRouter from './routers/statistics.router';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: config.app.name,
    version: config.app.version,
    status: 'running',
    endpoints: [
      'GET /api/coupons - 获取团购券码列表',
      'POST /api/coupons - 创建团购券码',
      'GET /api/coupons/:id - 获取单个团购券码',
      'PUT /api/coupons/:id - 更新团购券码',
      'DELETE /api/coupons/:id - 删除团购券码',
      'POST /api/verifications/import - 批量导入核销记录预检',
      'POST /api/verifications/check-duplicate - 券码重复核销异常判定',
      'POST /api/verifications/triage - 分诊核销异常',
      'GET /api/statistics/success-rate - 核销成功率统计',
      'GET /api/gates/:id/snapshot - 入园闸机快照',
      'POST /api/supplementary/review - 复核游客凭证',
      'POST /api/exception-events/suggestion - 计算异常处理建议',
      'GET /api/audit-logs - 审计日志查询',
      'POST /api/seed/reset - 重置seed数据'
    ]
  });
});

app.use('/api/coupons', couponRouter);
app.use('/api/verifications', verificationRouter);
app.use('/api/gates', gateRouter);
app.use('/api/exception-reasons', exceptionReasonRouter);
app.use('/api/supplementary', supplementaryRouter);
app.use('/api/visitor-vouchers', visitorVoucherRouter);
app.use('/api/reconciliation-batches', reconciliationBatchRouter);
app.use('/api/status-flows', statusFlowRouter);
app.use('/api/rule-configs', ruleConfigRouter);
app.use('/api/exception-events', exceptionEventRouter);
app.use('/api/audit-logs', auditLogRouter);
app.use('/api/statistics', statisticsRouter);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

export default app;
