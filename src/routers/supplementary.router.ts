import { Router, Request, Response } from 'express';
import { SupplementaryService } from '../services/supplementary.service';
import { CreateSupplementarySchema, UpdateSupplementarySchema, SupplementaryQuerySchema, ReviewSupplementarySchema } from '../schemas/supplementary.schema';

const router = Router();
const supplementaryService = new SupplementaryService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = SupplementaryQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const supplementaries = supplementaryService.getAllSupplementaries(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedSupplementaries = supplementaries.slice(start, end);

    res.json({
      success: true,
      data: paginatedSupplementaries,
      pagination: {
        page,
        page_size,
        total: supplementaries.length,
        total_pages: Math.ceil(supplementaries.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const supplementary = supplementaryService.getSupplementaryById(req.params.id);
    if (!supplementary) {
      return res.status(404).json({ success: false, error: '补录申请不存在' });
    }
    res.json({ success: true, data: supplementary });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateSupplementarySchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const supplementary = supplementaryService.createSupplementary(dto, operator);
    res.status(201).json({ success: true, data: supplementary });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateSupplementarySchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const supplementary = supplementaryService.updateSupplementary(req.params.id, dto, operator);
    res.json({ success: true, data: supplementary });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = supplementaryService.deleteSupplementary(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/review', (req: Request, res: Response) => {
  try {
    const dto = ReviewSupplementarySchema.parse(req.body);
    const supplementary = supplementaryService.reviewSupplementary(req.params.id, dto);
    res.json({ success: true, data: supplementary });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/review', (req: Request, res: Response) => {
  try {
    const { supplementary_id } = req.body;
    const operator = req.body.operator || '系统管理员';
    if (!supplementary_id) {
      return res.status(400).json({ success: false, error: '补录申请ID不能为空' });
    }
    const result = supplementaryService.reviewVouchers(supplementary_id, operator);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
