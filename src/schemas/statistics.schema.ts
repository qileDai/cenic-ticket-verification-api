import { z } from 'zod';

export const StatisticsQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '开始日期格式错误'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '结束日期格式错误'),
  batch_no: z.string().optional(),
  platform: z.string().optional(),
  group_by: z.enum(['day', 'batch', 'operator']).default('day')
});

export const SuccessRateQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  batch_no: z.string().optional(),
  platform: z.string().optional(),
  group_by: z.enum(['day', 'batch', 'operator']).default('day')
});

export const ExceptionRateQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  batch_no: z.string().optional(),
  group_by: z.enum(['day', 'batch', 'operator']).default('day')
});

export const DuplicateRateQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  batch_no: z.string().optional(),
  group_by: z.enum(['day', 'batch', 'operator']).default('day')
});
