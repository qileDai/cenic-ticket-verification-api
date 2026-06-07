import { z } from 'zod';

export const VoucherVerifyStatusSchema = z.enum(['待验证', '验证通过', '验证失败']);

export const CreateVisitorVoucherSchema = z.object({
  supplementary_id: z.string().optional(),
  coupon_id: z.string().min(1, '券码ID不能为空'),
  voucher_type: z.string().min(1, '凭证类型不能为空').max(50),
  voucher_no: z.string().min(1, '凭证编号不能为空').max(50),
  voucher_image: z.string().max(500).optional(),
  upload_time: z.string().min(1, '上传时间不能为空'),
  uploader: z.string().min(1, '上传人不能为空'),
  remark: z.string().max(500).optional()
});

export const UpdateVisitorVoucherSchema = z.object({
  voucher_type: z.string().min(1).max(50).optional(),
  voucher_no: z.string().min(1).max(50).optional(),
  voucher_image: z.string().max(500).optional(),
  verify_status: VoucherVerifyStatusSchema.optional(),
  verify_result: z.string().max(200).optional(),
  verify_time: z.string().optional(),
  verifier: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const VerifyVoucherSchema = z.object({
  verify_status: z.enum(['验证通过', '验证失败']),
  verify_result: z.string().max(200).optional(),
  verifier: z.string().min(1, '验证人不能为空')
});

export const VisitorVoucherQuerySchema = z.object({
  coupon_id: z.string().optional(),
  supplementary_id: z.string().optional(),
  verify_status: VoucherVerifyStatusSchema.optional(),
  uploader: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
