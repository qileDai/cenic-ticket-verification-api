export type ExceptionEventStatus = '待处理' | '处理中' | '已处理' | '已驳回';
export type ExceptionSeverity = '轻微' | '一般' | '严重' | '紧急';

export interface ExceptionEvent {
  id: string;
  event_no: string;
  event_type: string;
  coupon_id?: string;
  verification_id?: string;
  gate_id?: string;
  voucher_id?: string;
  batch_no?: string;
  severity: ExceptionSeverity;
  status: ExceptionEventStatus;
  trigger_fields?: string;
  threshold_value?: number;
  handler?: string;
  handle_deadline?: string;
  handle_time?: string;
  handle_result?: string;
  suggestion?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExceptionEventDTO {
  event_no: string;
  event_type: string;
  coupon_id?: string;
  verification_id?: string;
  gate_id?: string;
  voucher_id?: string;
  batch_no?: string;
  severity?: ExceptionSeverity;
  trigger_fields?: string;
  threshold_value?: number;
  handler?: string;
  handle_deadline?: string;
  remark?: string;
}

export interface UpdateExceptionEventDTO {
  status?: ExceptionEventStatus;
  handler?: string;
  handle_time?: string;
  handle_result?: string;
  suggestion?: string;
  remark?: string;
}

export interface ExceptionSuggestionInput {
  coupon_id: string;
  verification_id?: string;
  gate_id?: string;
  voucher_ids?: string[];
  batch_no?: string;
}

export interface ExceptionSuggestionResult {
  suggestion: string;
  priority: ExceptionSeverity;
  actions: string[];
  related_entities: {
    coupon?: string;
    verification?: string;
    gate?: string;
    vouchers: string[];
  };
  estimated_handle_time: string;
}
