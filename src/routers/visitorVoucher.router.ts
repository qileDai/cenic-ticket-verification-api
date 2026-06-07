import { Router, Request, Response } from 'express';
import { VisitorVoucherService } from '../services/visitorVoucher.service';
import { CreateVisitorVoucherSchema, UpdateVisitorVoucherSchema, VisitorVoucherQuerySchema, VerifyVoucherSchema } from '../schemas/visitorVoucher.schema';

const router = Router();
const voucherService = new VisitorVoucherService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = VisitorVoucherQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const vouchers = voucherService.getAllVouchers(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedVouchers = vouchers.slice(start, end);

    res.json({
      success: true,
      data: paginatedVouchers,
      pagination: {
        page,
        page_size,
        total: vouchers.length,
        total_pages: Math.ceil(vouchers.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const voucher = voucherService.getVoucherById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, error: '游客凭证不存在' });
    }
    res.json({ success: true, data: voucher });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateVisitorVoucherSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const voucher = voucherService.createVoucher(dto, operator);
    res.status(201).json({ success: true, data: voucher });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateVisitorVoucherSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const voucher = voucherService.updateVoucher(req.params.id, dto, operator);
    res.json({ success: true, data: voucher });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = voucherService.deleteVoucher(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/verify', (req: Request, res: Response) => {
  try {
    const dto = VerifyVoucherSchema.parse(req.body);
    const voucher = voucherService.verifyVoucher(req.params.id, dto);
    res.json({ success: true, data: voucher });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
