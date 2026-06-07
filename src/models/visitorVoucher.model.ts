export type VoucherVerifyStatus = '待验证' | '验证通过' | '验证失败';

export interface VisitorVoucher {
  id: string;
  supplementary_id?: string;
  coupon_id: string;
  voucher_type: string;
  voucher_no: string;
  voucher_image?: string;
  upload_time: string;
  uploader: string;
  verify_status: VoucherVerifyStatus;
  verify_result?: string;
  verify_time?: string;
  verifier?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitorVoucherDTO {
  supplementary_id?: string;
  coupon_id: string;
  voucher_type: string;
  voucher_no: string;
  voucher_image?: string;
  upload_time: string;
  uploader: string;
  remark?: string;
}

export interface UpdateVisitorVoucherDTO {
  voucher_type?: string;
  voucher_no?: string;
  voucher_image?: string;
  verify_status?: VoucherVerifyStatus;
  verify_result?: string;
  verify_time?: string;
  verifier?: string;
  remark?: string;
}

export interface VerifyVoucherDTO {
  verify_status: '验证通过' | '验证失败';
  verify_result?: string;
  verifier: string;
}
