import { z } from 'zod';

export const ReconciliationStatusSchema = z.enum(['待对账', '对账中', '已完成', '有差异']);

export const CreateReconciliationBatchSchema = z.object({
  batch_no: z.string().min(1, '批次号不能为空').max(50),
  batch_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '批次日期格式错误'),
  platform: z.string().min(1, '平台不能为空').max(50),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const UpdateReconciliationBatchSchema = z.object({
  total_count: z.number().int().nonnegative().optional(),
  success_count: z.number().int().nonnegative().optional(),
  exception_count: z.number().int().nonnegative().optional(),
  supplementary_count: z.number().int().nonnegative().optional(),
  status: ReconciliationStatusSchema.optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  remark: z.string().max(500).optional()
});

export const ReconciliationBatchQuerySchema = z.object({
  status: ReconciliationStatusSchema.optional(),
  platform: z.string().optional(),
  batch_date: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
