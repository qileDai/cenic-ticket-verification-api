import { z } from 'zod';

export const CreateAuditLogSchema = z.object({
  operator: z.string().min(1, '操作人不能为空').max(50),
  operation: z.string().min(1, '操作类型不能为空').max(50),
  entity_type: z.string().min(1, '实体类型不能为空').max(50),
  entity_id: z.string().optional(),
  old_value: z.string().optional(),
  new_value: z.string().optional(),
  ip_address: z.string().max(50).optional(),
  user_agent: z.string().max(500).optional(),
  remark: z.string().max(500).optional()
});

export const AuditLogQuerySchema = z.object({
  operator: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  operation: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
