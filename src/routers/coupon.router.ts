import { Router, Request, Response } from 'express';
import { CouponService } from '../services/coupon.service';
import { CreateCouponSchema, UpdateCouponSchema, CouponQuerySchema } from '../schemas/coupon.schema';

const router = Router();
const couponService = new CouponService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = CouponQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const coupons = couponService.getAllCoupons(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedCoupons = coupons.slice(start, end);

    res.json({
      success: true,
      data: paginatedCoupons,
      pagination: {
        page,
        page_size,
        total: coupons.length,
        total_pages: Math.ceil(coupons.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const coupon = couponService.getCouponById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: '券码不存在' });
    }
    res.json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateCouponSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const coupon = couponService.createCoupon(dto, operator);
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateCouponSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const coupon = couponService.updateCoupon(req.params.id, dto, operator);
    res.json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = couponService.deleteCoupon(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/transitions', (req: Request, res: Response) => {
  try {
    const transitions = couponService.getStatusTransitions(req.params.id);
    res.json({ success: true, data: transitions });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
