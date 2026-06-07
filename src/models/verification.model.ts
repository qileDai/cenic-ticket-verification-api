export type VerificationStatus = '正常' | '异常' | '待复核' | '已补录' | '已作废';
export type VerificationType = '闸机核销' | '人工核销' | '补录核销';

export interface Verification {
  id: string;
  coupon_id: string;
  coupon_code: string;
  gate_id?: string;
  verification_time: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  operator: string;
  device_no?: string;
  batch_no: string;
  exception_reason?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVerificationDTO {
  coupon_id: string;
  coupon_code: string;
  gate_id?: string;
  verification_time: string;
  verification_type: VerificationType;
  operator: string;
  device_no?: string;
  batch_no: string;
  exception_reason?: string;
  remark?: string;
}

export interface UpdateVerificationDTO {
  status?: VerificationStatus;
  exception_reason?: string;
  remark?: string;
}

export interface ImportVerificationDTO {
  coupon_code: string;
  verification_time: string;
  verification_type: VerificationType;
  gate_id?: string;
  operator: string;
  device_no?: string;
  batch_no: string;
}

export interface ImportPreviewResult {
  row: number;
  data: ImportVerificationDTO;
  valid: boolean;
  errors: string[];
  coupon_exists: boolean;
  coupon_status: string;
  is_duplicate: boolean;
}
