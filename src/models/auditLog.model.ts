export interface AuditLog {
  id: string;
  operator: string;
  operation: string;
  entity_type: string;
  entity_id?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
  operate_time: string;
  remark?: string;
}

export interface CreateAuditLogDTO {
  operator: string;
  operation: string;
  entity_type: string;
  entity_id?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
  remark?: string;
}

export interface AuditLogQuery {
  operator?: string;
  entity_type?: string;
  entity_id?: string;
  operation?: string;
  start_time?: string;
  end_time?: string;
  page?: number;
  page_size?: number;
}
