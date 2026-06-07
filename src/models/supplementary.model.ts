export type SupplementaryStatus = '待复核' | '待补充' | '已确认' | '已归档' | '已驳回';

export interface SupplementaryApplication {
  id: string;
  verification_id: string;
  coupon_id: string;
  applicant: string;
  apply_time: string;
  reason: string;
  voucher_ids?: string;
  status: SupplementaryStatus;
  reviewer?: string;
  review_time?: string;
  review_result?: string;
  review_comment?: string;
  batch_no?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplementaryDTO {
  verification_id: string;
  coupon_id: string;
  applicant: string;
  apply_time: string;
  reason: string;
  voucher_ids?: string;
  batch_no?: string;
  remark?: string;
}

export interface UpdateSupplementaryDTO {
  voucher_ids?: string;
  status?: SupplementaryStatus;
  reviewer?: string;
  review_time?: string;
  review_result?: string;
  review_comment?: string;
  remark?: string;
}

export interface ReviewSupplementaryDTO {
  status: '已确认' | '已驳回' | '待补充';
  reviewer: string;
  review_comment?: string;
}
