import { Router, Request, Response } from 'express';
import { ReconciliationBatchService } from '../services/reconciliationBatch.service';
import { CreateReconciliationBatchSchema, UpdateReconciliationBatchSchema, ReconciliationBatchQuerySchema } from '../schemas/reconciliationBatch.schema';

const router = Router();
const reconciliationBatchService = new ReconciliationBatchService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = ReconciliationBatchQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const batches = reconciliationBatchService.getAllBatches(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedBatches = batches.slice(start, end);

    res.json({
      success: true,
      data: paginatedBatches,
      pagination: {
        page,
        page_size,
        total: batches.length,
        total_pages: Math.ceil(batches.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const batch = reconciliationBatchService.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: '对账批次不存在' });
    }
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateReconciliationBatchSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const batch = reconciliationBatchService.createBatch(dto, operator);
    res.status(201).json({ success: true, data: batch });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateReconciliationBatchSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const batch = reconciliationBatchService.updateBatch(req.params.id, dto, operator);
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = reconciliationBatchService.deleteBatch(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/difference', (req: Request, res: Response) => {
  try {
    const batch = reconciliationBatchService.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: '对账批次不存在' });
    }
    const difference = reconciliationBatchService.calculateDifference(batch.batch_no);
    res.json({ success: true, data: difference });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/start', (req: Request, res: Response) => {
  try {
    const operator = req.body.operator || '系统管理员';
    const batch = reconciliationBatchService.startReconciliation(req.params.id, operator);
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/complete', (req: Request, res: Response) => {
  try {
    const operator = req.body.operator || '系统管理员';
    const batch = reconciliationBatchService.completeReconciliation(req.params.id, operator);
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
