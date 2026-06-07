export type RuleConfigStatus = '启用' | '停用';

export interface RuleConfig {
  id: string;
  rule_code: string;
  rule_name: string;
  rule_type: string;
  rule_value: string;
  description?: string;
  threshold?: number;
  unit?: string;
  status: RuleConfigStatus;
  responsible_person?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleConfigDTO {
  rule_code: string;
  rule_name: string;
  rule_type: string;
  rule_value: string;
  description?: string;
  threshold?: number;
  unit?: string;
  responsible_person?: string;
  remark?: string;
}

export interface UpdateRuleConfigDTO {
  rule_name?: string;
  rule_value?: string;
  description?: string;
  threshold?: number;
  unit?: string;
  status?: RuleConfigStatus;
  responsible_person?: string;
  remark?: string;
}
