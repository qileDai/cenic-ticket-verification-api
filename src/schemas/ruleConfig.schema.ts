import { z } from 'zod';

export const RuleConfigStatusSchema = z.enum(['启用', '停用']);

export const CreateRuleConfigSchema = z.object({
  rule_code: z.string().min(1, '规则编码不能为空').max(50),
  rule_name: z.string().min(1, '规则名称不能为空').max(100),
  rule_type: z.string().min(1, '规则类型不能为空').max(50),
  rule_value: z.string().min(1, '规则值不能为空'),
  description: z.string().max(500).optional(),
  threshold: z.number().optional(),
  unit: z.string().max(20).optional(),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const UpdateRuleConfigSchema = z.object({
  rule_name: z.string().min(1).max(100).optional(),
  rule_value: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  threshold: z.number().optional(),
  unit: z.string().max(20).optional(),
  status: RuleConfigStatusSchema.optional(),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const RuleConfigQuerySchema = z.object({
  status: RuleConfigStatusSchema.optional(),
  rule_type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
