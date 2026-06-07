export type GateStatus = '在线' | '离线' | '维护中' | '已停用';

export interface Gate {
  id: string;
  gate_no: string;
  name: string;
  location: string;
  status: GateStatus;
  ip_address?: string;
  last_heartbeat?: string;
  responsible_person?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGateDTO {
  gate_no: string;
  name: string;
  location: string;
  ip_address?: string;
  responsible_person?: string;
  remark?: string;
}

export interface UpdateGateDTO {
  name?: string;
  location?: string;
  status?: GateStatus;
  ip_address?: string;
  last_heartbeat?: string;
  responsible_person?: string;
  remark?: string;
}

export interface GateSnapshot {
  gate: Gate;
  verification_count: number;
  last_verification_time?: string;
  snapshot_time: string;
}
