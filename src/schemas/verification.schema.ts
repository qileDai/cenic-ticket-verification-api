import { z } from 'zod';

export const VerificationStatusSchema = z.enum(['正常', '异常', '待复核', '已补录', '已作废']);
export const VerificationTypeSchema = z.enum(['闸机核销', '人工核销', '补录核销']);

export const CreateVerificationSchema = z.object({
  coupon_id: z.string().min(1, '券码ID不能为空'),
  coupon_code: z.string().min(1, '券码不能为空'),
  gate_id: z.string().optional(),
  verification_time: z.string().min(1, '核销时间不能为空'),
  verification_type: VerificationTypeSchema,
  operator: z.string().min(1, '操作人不能为空'),
  device_no: z.string().optional(),
  batch_no: z.string().min(1, '批次号不能为空'),
  exception_reason: z.string().optional(),
  remark: z.string().max(500).optional()
});

export const UpdateVerificationSchema = z.object({
  status: VerificationStatusSchema.optional(),
  exception_reason: z.string().optional(),
  remark: z.string().max(500).optional()
});

export const ImportVerificationSchema = z.object({
  coupon_code: z.string().min(1, '券码不能为空'),
  verification_time: z.string().min(1, '核销时间不能为空'),
  verification_type: VerificationTypeSchema,
  gate_id: z.string().optional(),
  operator: z.string().min(1, '操作人不能为空'),
  device_no: z.string().optional(),
  batch_no: z.string().min(1, '批次号不能为空')
});

export const ImportPreviewSchema = z.object({
  verifications: z.array(ImportVerificationSchema).min(1, '导入数据不能为空').max(1000, '单次导入不能超过1000条')
});

export const VerificationQuerySchema = z.object({
  status: VerificationStatusSchema.optional(),
  batch_no: z.string().optional(),
  coupon_code: z.string().optional(),
  operator: z.string().optional(),
  verification_type: VerificationTypeSchema.optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});

export const CheckDuplicateSchema = z.object({
  coupon_code: z.string().min(1, '券码不能为空'),
  batch_no: z.string().optional()
});
