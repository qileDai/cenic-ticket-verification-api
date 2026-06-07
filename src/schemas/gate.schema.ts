import { z } from 'zod';

export const GateStatusSchema = z.enum(['在线', '离线', '维护中', '已停用']);

export const CreateGateSchema = z.object({
  gate_no: z.string().min(1, '闸机编号不能为空').max(20, '闸机编号长度不能超过20'),
  name: z.string().min(1, '闸机名称不能为空').max(50, '闸机名称长度不能超过50'),
  location: z.string().min(1, '闸机位置不能为空').max(100, '闸机位置长度不能超过100'),
  ip_address: z.string().ip({ version: 'v4' }).optional().or(z.literal('')),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const UpdateGateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  location: z.string().min(1).max(100).optional(),
  status: GateStatusSchema.optional(),
  ip_address: z.string().ip({ version: 'v4' }).optional().or(z.literal('')),
  last_heartbeat: z.string().optional(),
  responsible_person: z.string().max(50).optional(),
  remark: z.string().max(500).optional()
});

export const GateQuerySchema = z.object({
  status: GateStatusSchema.optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});
