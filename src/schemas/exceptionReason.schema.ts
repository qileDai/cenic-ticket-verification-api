import { z } from 'zod';

export const ExceptionReasonStatusSchema = z.enum(['启用', '停用']);
export const ExceptionSeveritySchema = z.enum(['轻微', '一般', '严重', '紧急']);

export const CreateExceptionReasonSchema = z.object({
  code: z.string().min(1, '异常原因编码不能为空').max(20),
  name: z.string().min(1, '异常原因名称不能为空').max(50),
  category: z.string().min(1, '异常分类不能为空').max(50),
  severity: ExceptionSeveritySchema.default('一般'),
  description: z.string().max(500).optional(),
  solution: z.string().max(500).optional(),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const UpdateExceptionReasonSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  severity: ExceptionSeveritySchema.optional(),
  description: z.string().max(500).optional(),
  solution: z.string().max(500).optional(),
  status: ExceptionReasonStatusSchema.optional(),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const ExceptionReasonQuerySchema = z.object({
  status: ExceptionReasonStatusSchema.optional(),
  category: z.string().optional(),
  severity: ExceptionSeveritySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
