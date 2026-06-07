import { Router, Request, Response } from 'express';
import { VerificationService } from '../services/verification.service';
import { CreateVerificationSchema, UpdateVerificationSchema, VerificationQuerySchema, ImportPreviewSchema, CheckDuplicateSchema } from '../schemas/verification.schema';

const router = Router();
const verificationService = new VerificationService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = VerificationQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const verifications = verificationService.getAllVerifications(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedVerifications = verifications.slice(start, end);

    res.json({
      success: true,
      data: paginatedVerifications,
      pagination: {
        page,
        page_size,
        total: verifications.length,
        total_pages: Math.ceil(verifications.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const verification = verificationService.getVerificationById(req.params.id);
    if (!verification) {
      return res.status(404).json({ success: false, error: '核销记录不存在' });
    }
    res.json({ success: true, data: verification });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateVerificationSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const verification = verificationService.createVerification(dto, operator);
    res.status(201).json({ success: true, data: verification });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateVerificationSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const verification = verificationService.updateVerification(req.params.id, dto, operator);
    res.json({ success: true, data: verification });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = verificationService.deleteVerification(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/import', (req: Request, res: Response) => {
  try {
    const { verifications } = ImportPreviewSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const result = verificationService.batchImport(verifications, operator);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/import/preview', (req: Request, res: Response) => {
  try {
    const { verifications } = ImportPreviewSchema.parse(req.body);
    const results = verificationService.importPreview(verifications);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/check-duplicate', (req: Request, res: Response) => {
  try {
    const { coupon_code, batch_no } = CheckDuplicateSchema.parse(req.body);
    const result = verificationService.checkDuplicate(coupon_code, batch_no);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/triage', (req: Request, res: Response) => {
  try {
    const { verification_id } = req.body;
    const operator = req.body.operator || '系统管理员';
    if (!verification_id) {
      return res.status(400).json({ success: false, error: '核销记录ID不能为空' });
    }
    const result = verificationService.triageException(verification_id, operator);
    res.json({ success: result.success, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
