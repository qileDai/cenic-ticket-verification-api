import { Router, Request, Response } from 'express';
import { AuditLogService } from '../services/auditLog.service';
import { AuditLogQuerySchema } from '../schemas/auditLog.schema';

const router = Router();
const auditLogService = new AuditLogService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = AuditLogQuerySchema.parse(req.query);
    const result = auditLogService.getAuditLogs(query);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const log = auditLogService.getAuditLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, error: '审计日志不存在' });
    }
    res.json({ success: true, data: log });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/entity/:entityType/:entityId', (req: Request, res: Response) => {
  try {
    const logs = auditLogService.getEntityAuditLogs(
      req.params.entityType,
      req.params.entityId
    );
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/operator/:operator', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = auditLogService.getOperatorAuditLogs(req.params.operator, limit);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
