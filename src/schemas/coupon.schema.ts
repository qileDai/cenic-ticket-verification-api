import { z } from 'zod';

export const CouponStatusSchema = z.enum(['未核销', '已核销', '已过期', '已作废', '异常']);

export const CreateCouponSchema = z.object({
  code: z.string().min(1, '券码不能为空').max(50, '券码长度不能超过50'),
  name: z.string().min(1, '券码名称不能为空').max(100, '券码名称长度不能超过100'),
  face_value: z.number().positive('面值必须大于0'),
  purchase_price: z.number().nonnegative('购买价格不能为负'),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '有效期开始日期格式错误'),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '有效期结束日期格式错误'),
  batch_no: z.string().min(1, '批次号不能为空'),
  platform: z.string().min(1, '平台不能为空'),
  holder_name: z.string().max(50).optional(),
  holder_phone: z.string().regex(/^1[3-9]\d{9}$/).optional().or(z.literal('')),
  holder_id_card: z.string().length(18).optional().or(z.literal('')),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const UpdateCouponSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: CouponStatusSchema.optional(),
  face_value: z.number().positive().optional(),
  purchase_price: z.number().nonnegative().optional(),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  holder_name: z.string().max(50).optional(),
  holder_phone: z.string().regex(/^1[3-9]\d{9}$/).optional().or(z.literal('')),
  holder_id_card: z.string().length(18).optional().or(z.literal('')),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const CouponQuerySchema = z.object({
  status: CouponStatusSchema.optional(),
  batch_no: z.string().optional(),
  platform: z.string().optional(),
  holder_phone: z.string().optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
