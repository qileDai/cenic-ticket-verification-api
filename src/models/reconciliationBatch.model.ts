export type ReconciliationStatus = '待对账' | '对账中' | '已完成' | '有差异';

export interface ReconciliationBatch {
  id: string;
  batch_no: string;
  batch_date: string;
  platform: string;
  total_count: number;
  success_count: number;
  exception_count: number;
  supplementary_count: number;
  status: ReconciliationStatus;
  responsible_person?: string;
  start_time?: string;
  end_time?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReconciliationBatchDTO {
  batch_no: string;
  batch_date: string;
  platform: string;
  responsible_person?: string;
  remark?: string;
}

export interface UpdateReconciliationBatchDTO {
  total_count?: number;
  success_count?: number;
  exception_count?: number;
  supplementary_count?: number;
  status?: ReconciliationStatus;
  start_time?: string;
  end_time?: string;
  remark?: string;
}

export interface ReconciliationDifference {
  batch_no: string;
  platform: string;
  expected_count: number;
  actual_count: number;
  difference_count: number;
  missing_coupons: string[];
  extra_coupons: string[];
  exception_events: string[];
}
