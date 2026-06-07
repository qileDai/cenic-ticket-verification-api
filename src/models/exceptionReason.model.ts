export type ExceptionReasonStatus = '启用' | '停用';
export type ExceptionSeverity = '轻微' | '一般' | '严重' | '紧急';

export interface ExceptionReason {
  id: string;
  code: string;
  name: string;
  category: string;
  severity: ExceptionSeverity;
  description?: string;
  solution?: string;
  status: ExceptionReasonStatus;
  responsible_person?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExceptionReasonDTO {
  code: string;
  name: string;
  category: string;
  severity?: ExceptionSeverity;
  description?: string;
  solution?: string;
  responsible_person?: string;
  remark?: string;
}

export interface UpdateExceptionReasonDTO {
  name?: string;
  category?: string;
  severity?: ExceptionSeverity;
  description?: string;
  solution?: string;
  status?: ExceptionReasonStatus;
  responsible_person?: string;
  remark?: string;
}
