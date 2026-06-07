export interface StatusFlow {
  id: string;
  entity_type: string;
  entity_id: string;
  from_status?: string;
  to_status: string;
  operator: string;
  operate_time: string;
  reason?: string;
  remark?: string;
  created_at: string;
}

export interface CreateStatusFlowDTO {
  entity_type: string;
  entity_id: string;
  from_status?: string;
  to_status: string;
  operator: string;
  operate_time: string;
  reason?: string;
  remark?: string;
}

export interface StatusTransition {
  entity_type: string;
  current_status: string;
  allowed_next_statuses: string[];
  requires_reason: boolean;
}

export const STATUS_TRANSITIONS: StatusTransition[] = [
  {
    entity_type: 'coupon',
    current_status: '未核销',
    allowed_next_statuses: ['已核销', '异常'],
    requires_reason: false
  },
  {
    entity_type: 'coupon',
    current_status: '已核销',
    allowed_next_statuses: ['异常'],
    requires_reason: true
  },
  {
    entity_type: 'supplementary',
    current_status: '待复核',
    allowed_next_statuses: ['待补充', '已确认', '已驳回'],
    requires_reason: false
  },
  {
    entity_type: 'supplementary',
    current_status: '待补充',
    allowed_next_statuses: ['待复核', '已驳回'],
    requires_reason: false
  },
  {
    entity_type: 'supplementary',
    current_status: '已驳回',
    allowed_next_statuses: ['待复核'],
    requires_reason: false
  },
  {
    entity_type: 'supplementary',
    current_status: '已确认',
    allowed_next_statuses: ['已归档'],
    requires_reason: false
  },
  {
    entity_type: 'exception_event',
    current_status: '待处理',
    allowed_next_statuses: ['处理中', '已处理'],
    requires_reason: false
  },
  {
    entity_type: 'exception_event',
    current_status: '处理中',
    allowed_next_statuses: ['已处理', '已驳回'],
    requires_reason: false
  },
  {
    entity_type: 'exception_event',
    current_status: '已驳回',
    allowed_next_statuses: ['待处理'],
    requires_reason: false
  }
];
