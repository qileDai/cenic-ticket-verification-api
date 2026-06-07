import { z } from 'zod';

export const SupplementaryStatusSchema = z.enum(['待复核', '待补充', '已确认', '已归档', '已驳回']);

export const CreateSupplementarySchema = z.object({
  verification_id: z.string().min(1, '核销记录ID不能为空'),
  coupon_id: z.string().min(1, '券码ID不能为空'),
  applicant: z.string().min(1, '申请人不能为空'),
  apply_time: z.string().min(1, '申请时间不能为空'),
  reason: z.string().min(1, '申请原因不能为空').max(500, '申请原因长度不能超过500'),
  voucher_ids: z.string().optional(),
  batch_no: z.string().optional(),
  remark: z.string().max(500).optional()
});

export const UpdateSupplementarySchema = z.object({
  voucher_ids: z.string().optional(),
  status: SupplementaryStatusSchema.optional(),
  reviewer: z.string().max(50).optional(),
  review_time: z.string().optional(),
  review_result: z.string().max(200).optional(),
  review_comment: z.string().max(500).optional(),
  remark: z.string().max(500).optional()
});

export const ReviewSupplementarySchema = z.object({
  status: z.enum(['已确认', '已驳回', '待补充']),
  reviewer: z.string().min(1, '复核人不能为空'),
  review_comment: z.string().max(500).optional()
});

export const SupplementaryQuerySchema = z.object({
  status: SupplementaryStatusSchema.optional(),
  applicant: z.string().optional(),
  batch_no: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
