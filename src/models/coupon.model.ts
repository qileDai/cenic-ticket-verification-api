export type CouponStatus = '未核销' | '已核销' | '已过期' | '已作废' | '异常';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  status: CouponStatus;
  face_value: number;
  purchase_price: number;
  valid_from: string;
  valid_to: string;
  batch_no: string;
  platform: string;
  holder_name?: string;
  holder_phone?: string;
  holder_id_card?: string;
  responsible_person?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponDTO {
  code: string;
  name: string;
  face_value: number;
  purchase_price: number;
  valid_from: string;
  valid_to: string;
  batch_no: string;
  platform: string;
  holder_name?: string;
  holder_phone?: string;
  holder_id_card?: string;
  responsible_person?: string;
  remark?: string;
}

export interface UpdateCouponDTO {
  name?: string;
  status?: CouponStatus;
  face_value?: number;
  purchase_price?: number;
  valid_from?: string;
  valid_to?: string;
  holder_name?: string;
  holder_phone?: string;
  holder_id_card?: string;
  responsible_person?: string;
  remark?: string;
}
