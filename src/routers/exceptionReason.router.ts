import { Router, Request, Response } from 'express';
import { ExceptionReasonService } from '../services/exceptionReason.service';
import { CreateExceptionReasonSchema, UpdateExceptionReasonSchema, ExceptionReasonQuerySchema } from '../schemas/exceptionReason.schema';

const router = Router();
const exceptionReasonService = new ExceptionReasonService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = ExceptionReasonQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const reasons = exceptionReasonService.getAllExceptionReasons(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedReasons = reasons.slice(start, end);

    res.json({
      success: true,
      data: paginatedReasons,
      pagination: {
        page,
        page_size,
        total: reasons.length,
        total_pages: Math.ceil(reasons.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const reason = exceptionReasonService.getExceptionReasonById(req.params.id);
    if (!reason) {
      return res.status(404).json({ success: false, error: '异常原因不存在' });
    }
    res.json({ success: true, data: reason });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateExceptionReasonSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const reason = exceptionReasonService.createExceptionReason(dto, operator);
    res.status(201).json({ success: true, data: reason });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateExceptionReasonSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const reason = exceptionReasonService.updateExceptionReason(req.params.id, dto, operator);
    res.json({ success: true, data: reason });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = exceptionReasonService.deleteExceptionReason(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
