import { z } from 'zod';

export const ExceptionEventStatusSchema = z.enum(['待处理', '处理中', '已处理', '已驳回']);
export const ExceptionSeveritySchema = z.enum(['轻微', '一般', '严重', '紧急']);

export const CreateExceptionEventSchema = z.object({
  event_no: z.string().min(1, '事件编号不能为空').max(50),
  event_type: z.string().min(1, '事件类型不能为空').max(50),
  coupon_id: z.string().optional(),
  verification_id: z.string().optional(),
  gate_id: z.string().optional(),
  voucher_id: z.string().optional(),
  batch_no: z.string().optional(),
  severity: ExceptionSeveritySchema.default('一般'),
  trigger_fields: z.string().optional(),
  threshold_value: z.number().optional(),
  handler: z.string().max(50).optional(),
  handle_deadline: z.string().optional(),
  remark: z.string().max(500).optional()
});

export const UpdateExceptionEventSchema = z.object({
  status: ExceptionEventStatusSchema.optional(),
  handler: z.string().max(50).optional(),
  handle_time: z.string().optional(),
  handle_result: z.string().max(500).optional(),
  suggestion: z.string().max(500).optional(),
  remark: z.string().max(500).optional()
});

export const ExceptionEventQuerySchema = z.object({
  status: ExceptionEventStatusSchema.optional(),
  event_type: z.string().optional(),
  severity: ExceptionSeveritySchema.optional(),
  batch_no: z.string().optional(),
  handler: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});

export const ExceptionSuggestionSchema = z.object({
  coupon_id: z.string().min(1, '券码ID不能为空'),
  verification_id: z.string().optional(),
  gate_id: z.string().optional(),
  voucher_ids: z.array(z.string()).optional(),
  batch_no: z.string().optional()
});
